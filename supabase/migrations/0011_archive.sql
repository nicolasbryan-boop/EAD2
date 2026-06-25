-- ============================================================================
-- Trilogia do Sucesso — Migration 0011 (Fase 1: arquivar)
-- Arquivamento de módulo/aula. Curso já tem status ('archived').
-- Não apaga nada; conteúdo arquivado é apenas escondido do aluno.
-- ============================================================================

alter table public.course_modules
  add column if not exists is_archived boolean not null default false;

alter table public.lessons
  add column if not exists is_archived boolean not null default false;
