-- ============================================================================
-- Trilogia do Sucesso — Migration 0012 (Fase 2: liberação programada)
-- Regras de liberação por módulo. Não apaga conteúdo nem progresso.
-- ============================================================================

alter table public.course_modules
  add column if not exists release_type text not null default 'immediate'
    check (release_type in ('immediate', 'scheduled_date', 'days_after_enrollment')),
  add column if not exists release_at timestamptz,
  add column if not exists release_after_days int;
