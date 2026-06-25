-- ============================================================================
-- Trilogia do Sucesso — Migration 0010 (Painel administrativo)
-- super_admin, log de auditoria e campos extras de curso/módulo/aula.
-- Nada aqui apaga conteúdo ou progresso existente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ROLES: adiciona super_admin
-- ----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'admin', 'super_admin'));

-- is_admin() passa a valer também para super_admin.
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- ----------------------------------------------------------------------------
-- LOG DE AUDITORIA (ações administrativas importantes)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users (id) on delete set null,
  course_id uuid references public.courses (id) on delete set null,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
drop policy if exists "audit_admin_read" on public.admin_audit_log;
create policy "audit_admin_read" on public.admin_audit_log
  for select using (public.is_admin());
-- Gravação só pela service role (admin actions no servidor).

-- ----------------------------------------------------------------------------
-- CAMPOS EXTRAS
-- ----------------------------------------------------------------------------
-- Curso: status (rótulo) + destaque na home.
alter table public.courses
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  add column if not exists is_featured boolean not null default false,
  add column if not exists position int not null default 0;

-- Sincroniza status com is_published já existente (gate de acesso).
update public.courses set status = case when is_published then 'published' else 'draft' end;

-- Módulo: pode ser ocultado.
alter table public.course_modules
  add column if not exists is_published boolean not null default true;

-- Aula: publicação, tipo de conteúdo e aula gratuita (demo).
alter table public.lessons
  add column if not exists is_published boolean not null default true,
  add column if not exists is_free boolean not null default false,
  add column if not exists lesson_type text not null default 'video';
