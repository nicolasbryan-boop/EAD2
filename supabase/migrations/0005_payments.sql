-- ============================================================================
-- Trilogia do Sucesso — Migration 0005 (Fase 5)
-- Carrinho, pedidos, eventos de pagamento e crédito via webhook.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CARRINHO (um por usuário) + ITENS
-- ----------------------------------------------------------------------------
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  package_slug text not null references public.credit_packages (slug),
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, package_slug)
);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

drop policy if exists "carts_all_own" on public.carts;
create policy "carts_all_own" on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "cart_items_all_own" on public.cart_items;
create policy "cart_items_all_own" on public.cart_items
  for all using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- PEDIDOS
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled')),
  amount_cents int not null,
  credits_total int not null,
  items jsonb not null default '[]'::jsonb,
  provider text not null default 'mercadopago',
  provider_preference_id text,
  provider_payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (user_id = auth.uid());
-- Atualização de status (paid/failed) só via service role no webhook.

-- ----------------------------------------------------------------------------
-- EVENTOS DE PAGAMENTO (log idempotente do webhook)
-- ----------------------------------------------------------------------------
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercadopago',
  event_type text,
  provider_event_id text not null,
  order_id uuid references public.orders (id) on delete set null,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

alter table public.payment_events enable row level security;
-- Só admin lê; gravação é exclusiva do webhook (service role, ignora RLS).
drop policy if exists "payment_events_admin_read" on public.payment_events;
create policy "payment_events_admin_read" on public.payment_events
  for select using (public.is_admin());

-- ----------------------------------------------------------------------------
-- CRÉDITO POR USUÁRIO (usado pelo webhook após pagamento aprovado).
-- SECURITY DEFINER + idempotência garantida pelo chamador (payment_events).
-- ----------------------------------------------------------------------------
create or replace function public.add_credits_for(
  p_user_id uuid,
  p_amount int,
  p_type text default 'purchase',
  p_reason text default 'compra'
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null or p_amount <= 0 then return; end if;
  insert into public.user_credits (user_id, balance)
    values (p_user_id, p_amount)
    on conflict (user_id) do update
      set balance = public.user_credits.balance + p_amount, updated_at = now();
  insert into public.credit_transactions (user_id, amount, type, reason)
    values (p_user_id, p_amount, p_type, p_reason);
end;
$$;

-- ----------------------------------------------------------------------------
-- Pacote de UPSELL (oferta especial; não listado na grade de pacotes).
-- ----------------------------------------------------------------------------
insert into public.credit_packages (slug, name, credits, price_cents, is_active, position)
values ('upsell-1000', 'Oferta: +1.000 créditos', 1000, 1490, false, 99)
on conflict (slug) do update
  set name = excluded.name, credits = excluded.credits,
      price_cents = excluded.price_cents;
