-- ============================================================================
-- Trilogia do Sucesso — Migration 0001 (Fase 1)
-- Base de autenticação/perfis + catálogos de referência.
-- Rodar no SQL Editor do Supabase (ou via `supabase db push`).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES (1:1 com auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'admin')),
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: o usuário atual é admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- RLS: aluno vê/edita o próprio perfil; admin vê tudo.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Cria automaticamente um profile quando um usuário é criado no auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- CATÁLOGOS DE REFERÊNCIA (leitura pública para usuários autenticados)
-- ----------------------------------------------------------------------------

-- Agentes de IA (ia-1 liberada; ia-2/ia-3 bloqueadas).
create table if not exists public.ai_agents (
  slug text primary key,
  name text not null,
  description text,
  is_active boolean not null default false,
  position int not null default 0
);
alter table public.ai_agents enable row level security;
drop policy if exists "ai_agents_read" on public.ai_agents;
create policy "ai_agents_read" on public.ai_agents
  for select using (auth.role() = 'authenticated');

insert into public.ai_agents (slug, name, description, is_active, position) values
  ('ia-1', 'IA 1', 'Sua assistente inteligente para aplicar o conteúdo da Trilogia do Sucesso.', true, 1),
  ('ia-2', 'IA 2', 'Novo agente inteligente em desenvolvimento.', false, 2),
  ('ia-3', 'IA 3', 'Novo agente inteligente em desenvolvimento.', false, 3)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      is_active = excluded.is_active,
      position = excluded.position;

-- Conquistas (catálogo).
create table if not exists public.achievements (
  slug text primary key,
  title text not null,
  description text not null,
  position int not null default 0
);
alter table public.achievements enable row level security;
drop policy if exists "achievements_read" on public.achievements;
create policy "achievements_read" on public.achievements
  for select using (auth.role() = 'authenticated');

insert into public.achievements (slug, title, description, position) values
  ('primeiro-passo', 'Primeiro Passo', 'Assistiu sua primeira aula.', 1),
  ('aluno-consistente', 'Aluno Consistente', 'Assistiu 5 aulas na plataforma.', 2),
  ('maratonista', 'Maratonista', 'Assistiu 10 aulas.', 3),
  ('mente-estrategica', 'Mente Estratégica', 'Usou a IA 1 pela primeira vez.', 4),
  ('explorador-inteligente', 'Explorador Inteligente', 'Fez 10 perguntas para a IA.', 5),
  ('executor', 'Executor', 'Concluiu um módulo inteiro.', 6),
  ('foco-total', 'Foco Total', 'Acessou a plataforma por 3 dias diferentes.', 7),
  ('aluno-avancado', 'Aluno Avançado', 'Concluiu 50% do curso.', 8),
  ('trilogia-completa', 'Trilogia Completa', 'Concluiu 100% das aulas disponíveis.', 9)
on conflict (slug) do update
  set title = excluded.title,
      description = excluded.description,
      position = excluded.position;

-- Pacotes de crédito.
create table if not exists public.credit_packages (
  slug text primary key,
  name text not null,
  credits int not null,
  price_cents int not null,
  is_active boolean not null default true,
  position int not null default 0
);
alter table public.credit_packages enable row level security;
drop policy if exists "credit_packages_read" on public.credit_packages;
create policy "credit_packages_read" on public.credit_packages
  for select using (auth.role() = 'authenticated');

insert into public.credit_packages (slug, name, credits, price_cents, position) values
  ('pacote-1000', 'Pacote Inicial', 1000, 2990, 1),
  ('pacote-3000', 'Pacote Plus', 3000, 6990, 2),
  ('pacote-10000', 'Pacote Pro', 10000, 19990, 3)
on conflict (slug) do update
  set name = excluded.name,
      credits = excluded.credits,
      price_cents = excluded.price_cents,
      position = excluded.position;

-- ----------------------------------------------------------------------------
-- SALDO DE CRÉDITOS (estrutura base — uso completo na Fase 4/5)
-- ----------------------------------------------------------------------------
create table if not exists public.user_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.user_credits enable row level security;
drop policy if exists "user_credits_read_own" on public.user_credits;
create policy "user_credits_read_own" on public.user_credits
  for select using (user_id = auth.uid() or public.is_admin());
-- Saldo só é alterado server-side (service role) — sem policy de insert/update p/ aluno.
