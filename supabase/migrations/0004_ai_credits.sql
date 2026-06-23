-- ============================================================================
-- Trilogia do Sucesso — Migration 0004 (Fase 4)
-- IA: conversas e mensagens. Créditos: ledger de transações + funções
-- atômicas de débito/crédito (server-side, à prova de burla).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- AI CONVERSATIONS / MESSAGES
-- ----------------------------------------------------------------------------
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent_slug text not null references public.ai_agents (slug),
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  has_image boolean not null default false,
  has_file boolean not null default false,
  credits_cost int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

-- Conversas: o aluno gerencia só as próprias.
drop policy if exists "conv_select_own" on public.ai_conversations;
create policy "conv_select_own" on public.ai_conversations
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "conv_insert_own" on public.ai_conversations;
create policy "conv_insert_own" on public.ai_conversations
  for insert with check (user_id = auth.uid());
drop policy if exists "conv_update_own" on public.ai_conversations;
create policy "conv_update_own" on public.ai_conversations
  for update using (user_id = auth.uid());
drop policy if exists "conv_delete_own" on public.ai_conversations;
create policy "conv_delete_own" on public.ai_conversations
  for delete using (user_id = auth.uid());

-- Mensagens: visíveis/inseríveis se a conversa for do usuário.
drop policy if exists "msg_select_own" on public.ai_messages;
create policy "msg_select_own" on public.ai_messages
  for select using (
    exists (select 1 from public.ai_conversations c
            where c.id = conversation_id
              and (c.user_id = auth.uid() or public.is_admin()))
  );
drop policy if exists "msg_insert_own" on public.ai_messages;
create policy "msg_insert_own" on public.ai_messages
  for insert with check (
    exists (select 1 from public.ai_conversations c
            where c.id = conversation_id and c.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- CREDIT TRANSACTIONS (ledger)
-- ----------------------------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount int not null, -- positivo = crédito; negativo = débito
  type text not null check (type in ('debit', 'purchase', 'refund', 'bonus', 'grant')),
  reason text,
  created_at timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;
drop policy if exists "tx_select_own" on public.credit_transactions;
create policy "tx_select_own" on public.credit_transactions
  for select using (user_id = auth.uid() or public.is_admin());
-- Sem insert para o aluno: saldo só muda via funções abaixo (security definer).

-- ----------------------------------------------------------------------------
-- DÉBITO ATÔMICO — usado pela IA. Trava a linha, confere saldo e debita.
-- Retorna true se debitou; false se saldo insuficiente.
-- ----------------------------------------------------------------------------
create or replace function public.spend_credits(p_amount int, p_reason text default 'ia')
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_balance int;
begin
  if v_user is null or p_amount <= 0 then return false; end if;

  -- Garante a linha de saldo e trava para evitar corrida.
  insert into public.user_credits (user_id, balance)
    values (v_user, 0) on conflict (user_id) do nothing;

  select balance into v_balance from public.user_credits
    where user_id = v_user for update;

  if v_balance < p_amount then
    return false;
  end if;

  update public.user_credits
    set balance = balance - p_amount, updated_at = now()
    where user_id = v_user;

  insert into public.credit_transactions (user_id, amount, type, reason)
    values (v_user, -p_amount, 'debit', p_reason);

  return true;
end;
$$;

-- ----------------------------------------------------------------------------
-- CRÉDITO — usado para reembolso (IA falhou) e, na Fase 5, pelo webhook.
-- A versão "self" credita o usuário logado (reembolso pelo próprio app).
-- O webhook (service role) usará add_credits_for(user_id, ...) na Fase 5.
-- ----------------------------------------------------------------------------
create or replace function public.refund_credits(p_amount int, p_reason text default 'refund')
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null or p_amount <= 0 then return; end if;
  insert into public.user_credits (user_id, balance)
    values (v_user, p_amount)
    on conflict (user_id) do update set balance = public.user_credits.balance + p_amount,
                                        updated_at = now();
  insert into public.credit_transactions (user_id, amount, type, reason)
    values (v_user, p_amount, 'refund', p_reason);
end;
$$;
