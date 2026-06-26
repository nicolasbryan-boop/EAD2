/**
 * Regras de liberação de módulo (Fase 2).
 * - immediate: liberado sempre.
 * - scheduled_date: liberado a partir de release_at.
 * - days_after_enrollment: liberado X dias após a matrícula do aluno.
 *
 * Admin nunca fica bloqueado. O progresso do aluno é preservado — isto aqui
 * é apenas um GATE de visibilidade/acesso, não mexe em lesson_progress.
 */
export type ModuleRelease = {
  release_type?: string | null;
  release_at?: string | null;
  release_after_days?: number | null;
};

/** Data em que o módulo fica liberado para esta matrícula (null = imediato). */
export function moduleReleaseDate(
  m: ModuleRelease,
  enrolledAt: Date | null
): Date | null {
  if (m.release_type === "scheduled_date" && m.release_at) {
    return new Date(m.release_at);
  }
  if (
    m.release_type === "days_after_enrollment" &&
    m.release_after_days != null &&
    enrolledAt
  ) {
    return new Date(enrolledAt.getTime() + m.release_after_days * 86_400_000);
  }
  return null;
}

/** O módulo está bloqueado agora? (admin sempre false). */
export function isModuleLocked(
  m: ModuleRelease,
  enrolledAt: Date | null,
  isAdmin: boolean,
  now: Date = new Date()
): { locked: boolean; releaseAt: Date | null } {
  const releaseAt = moduleReleaseDate(m, enrolledAt);
  if (isAdmin) return { locked: false, releaseAt };
  return { locked: !!releaseAt && now < releaseAt, releaseAt };
}

export function formatReleaseDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
