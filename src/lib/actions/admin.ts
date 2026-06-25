"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, logAudit } from "@/lib/admin";

/** Admin responde um chamado (marca como 'answered'). */
export async function adminReply(ticketId: string, body: string) {
  if (!body.trim()) return { ok: false, error: "Escreva uma resposta." };
  let admin, userId;
  try {
    ({ admin, userId } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }

  const { error } = await admin.from("support_replies").insert({
    ticket_id: ticketId,
    author_id: userId,
    is_admin: true,
    body: body.trim(),
  });
  if (error) return { ok: false, error: error.message };

  await admin
    .from("support_tickets")
    .update({ status: "answered", updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  revalidatePath(`/admin/chamados/${ticketId}`);
  return { ok: true };
}

/** Admin altera o status do chamado. */
export async function adminSetTicketStatus(ticketId: string, status: string) {
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  revalidatePath(`/admin/chamados/${ticketId}`);
  revalidatePath("/admin/chamados");
  return { ok: true };
}

/** Admin concede créditos a um aluno (auditado). */
export async function adminGrantCredits(userId: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0)
    return { ok: false, error: "Quantidade inválida." };
  let admin, actorId;
  try {
    ({ admin, userId: actorId } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin.rpc("add_credits_for", {
    p_user_id: userId,
    p_amount: Math.floor(amount),
    p_type: "grant",
    p_reason: "admin",
  });
  await logAudit(admin, actorId, "grant_credits", {
    targetUserId: userId,
    metadata: { amount: Math.floor(amount) },
  });
  revalidatePath("/admin/alunos");
  return { ok: true };
}

/** Admin ativa/expira a matrícula de um aluno num curso (auditado). */
export async function adminSetEnrollment(
  userId: string,
  courseId: string,
  active: boolean,
  reason?: string
) {
  let admin, actorId;
  try {
    ({ admin, userId: actorId } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin.from("enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      status: active ? "active" : "expired",
    },
    { onConflict: "user_id,course_id" }
  );
  await logAudit(admin, actorId, active ? "enroll_grant" : "enroll_revoke", {
    targetUserId: userId,
    courseId,
    reason: reason ?? "liberação manual",
  });
  revalidatePath("/admin/alunos");
  return { ok: true };
}

/**
 * Salva a ESTRUTURA do curso (ordem dos módulos, ordem das aulas e a qual
 * módulo cada aula pertence) numa só operação. Preserva o progresso dos
 * alunos — lesson_progress é vinculado ao lesson_id, que não muda ao
 * reordenar ou mover a aula de módulo.
 */
export async function adminSaveCourseStructure(
  courseId: string,
  modules: { id: string; lessonIds: string[] }[]
) {
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }

  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    await admin
      .from("course_modules")
      .update({ position: i })
      .eq("id", m.id)
      .eq("course_id", courseId);
    for (let j = 0; j < m.lessonIds.length; j++) {
      await admin
        .from("lessons")
        .update({ position: j, module_id: m.id })
        .eq("id", m.lessonIds[j]);
    }
  }

  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Renomeia um módulo. */
export async function adminRenameModule(moduleId: string, title: string) {
  if (!title.trim()) return { ok: false, error: "Informe o título." };
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin.from("course_modules").update({ title: title.trim() }).eq("id", moduleId);
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Exclui um módulo (e suas aulas, em cascata). UI confirma antes. */
export async function adminDeleteModule(moduleId: string) {
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin.from("course_modules").delete().eq("id", moduleId);
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Exclui uma aula. UI confirma antes. */
export async function adminDeleteLesson(lessonId: string) {
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin.from("lessons").delete().eq("id", lessonId);
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Admin cria um novo curso (publicado, com preço em centavos). */
export async function adminCreateCourse(input: {
  title: string;
  priceCents: number;
  description?: string;
}) {
  if (!input.title.trim()) return { ok: false, error: "Informe o título." };
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }

  const base = slugify(input.title) || "curso";
  // Sufixo curto para evitar colisão de slug.
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const { count } = await admin
    .from("courses")
    .select("id", { count: "exact", head: true });

  const { error } = await admin.from("courses").insert({
    slug,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    price_cents: Math.max(0, Math.floor(input.priceCents)),
    position: (count ?? 0) + 1,
    is_published: true,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/conteudo");
  return { ok: true, slug };
}

/** Admin edita um curso: preço, capa, descrição e publicação. */
export async function adminUpdateCourse(input: {
  courseId: string;
  priceCents?: number;
  coverImageUrl?: string;
  shortDescription?: string;
  isPublished?: boolean;
}) {
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }

  const patch: Record<string, unknown> = {};
  if (input.priceCents !== undefined)
    patch.price_cents = Math.max(0, Math.floor(input.priceCents));
  if (input.coverImageUrl !== undefined)
    patch.cover_image_url = input.coverImageUrl.trim() || null;
  if (input.shortDescription !== undefined)
    patch.short_description = input.shortDescription.trim() || null;
  if (input.isPublished !== undefined) patch.is_published = input.isPublished;

  await admin.from("courses").update(patch).eq("id", input.courseId);
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Admin cria um módulo. */
export async function adminCreateModule(courseId: string, title: string) {
  if (!title.trim()) return { ok: false, error: "Informe o título." };
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  const { count } = await admin
    .from("course_modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);
  await admin.from("course_modules").insert({
    course_id: courseId,
    title: title.trim(),
    position: (count ?? 0) + 1,
  });
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Admin cria uma aula (com embed externo opcional). */
export async function adminCreateLesson(input: {
  moduleId: string;
  title: string;
  description?: string;
  videoEmbed?: string;
}) {
  if (!input.title.trim()) return { ok: false, error: "Informe o título." };
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  const { count } = await admin
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", input.moduleId);
  await admin.from("lessons").insert({
    module_id: input.moduleId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    video_embed: input.videoEmbed?.trim() || null,
    position: (count ?? 0) + 1,
  });
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/* ============================================================================
 * FASE 1 — Duplicar e arquivar
 * Duplicar NUNCA copia matrículas, progresso ou comentários — só estrutura.
 * ==========================================================================*/

/** Duplica uma aula no mesmo módulo (como rascunho, prefixo "Cópia de"). */
export async function adminDuplicateLesson(lessonId: string) {
  let admin, actorId;
  try {
    ({ admin, userId: actorId } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  const { data: l } = await admin
    .from("lessons")
    .select("module_id, title, description, video_embed, lesson_type, is_free")
    .eq("id", lessonId)
    .maybeSingle();
  if (!l) return { ok: false, error: "Aula não encontrada." };

  const { count } = await admin
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", l.module_id);

  await admin.from("lessons").insert({
    module_id: l.module_id,
    title: `Cópia de ${l.title}`,
    description: l.description,
    video_embed: l.video_embed,
    lesson_type: l.lesson_type,
    is_free: l.is_free,
    is_published: false, // rascunho
    position: count ?? 0,
  });
  await logAudit(admin, actorId, "duplicate_lesson", { metadata: { lessonId } });
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Duplica um módulo com todas as suas aulas (como rascunho). */
export async function adminDuplicateModule(moduleId: string) {
  let admin, actorId;
  try {
    ({ admin, userId: actorId } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  const { data: m } = await admin
    .from("course_modules")
    .select("course_id, title, description")
    .eq("id", moduleId)
    .maybeSingle();
  if (!m) return { ok: false, error: "Módulo não encontrado." };

  const { count } = await admin
    .from("course_modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", m.course_id);

  const { data: newMod } = await admin
    .from("course_modules")
    .insert({
      course_id: m.course_id,
      title: `Cópia de ${m.title}`,
      description: m.description,
      position: count ?? 0,
      is_published: false,
    })
    .select("id")
    .single();
  if (!newMod) return { ok: false, error: "Falha ao duplicar." };

  const { data: lessons } = await admin
    .from("lessons")
    .select("title, description, video_embed, lesson_type, is_free, position")
    .eq("module_id", moduleId)
    .order("position", { ascending: true });

  if (lessons && lessons.length > 0) {
    await admin.from("lessons").insert(
      lessons.map((l, i) => ({
        module_id: newMod.id,
        title: l.title,
        description: l.description,
        video_embed: l.video_embed,
        lesson_type: l.lesson_type,
        is_free: l.is_free,
        is_published: false,
        position: i,
      }))
    );
  }
  await logAudit(admin, actorId, "duplicate_module", { metadata: { moduleId } });
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Duplica um curso completo (módulos + aulas) como rascunho. */
export async function adminDuplicateCourse(courseId: string) {
  let admin, actorId;
  try {
    ({ admin, userId: actorId } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  const { data: c } = await admin
    .from("courses")
    .select("title, description, short_description, cover_image_url, price_cents")
    .eq("id", courseId)
    .maybeSingle();
  if (!c) return { ok: false, error: "Curso não encontrado." };

  const slug = `${slugify(c.title) || "curso"}-${Math.random().toString(36).slice(2, 6)}`;
  const { count } = await admin
    .from("courses")
    .select("id", { count: "exact", head: true });

  const { data: newCourse } = await admin
    .from("courses")
    .insert({
      slug,
      title: `Cópia de ${c.title}`,
      description: c.description,
      short_description: c.short_description,
      cover_image_url: c.cover_image_url,
      price_cents: c.price_cents,
      status: "draft",
      is_published: false,
      is_featured: false,
      position: (count ?? 0) + 1,
    })
    .select("id")
    .single();
  if (!newCourse) return { ok: false, error: "Falha ao duplicar." };

  const { data: modules } = await admin
    .from("course_modules")
    .select("id, title, description, position")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  for (const [mi, mod] of (modules ?? []).entries()) {
    const { data: nm } = await admin
      .from("course_modules")
      .insert({
        course_id: newCourse.id,
        title: mod.title,
        description: mod.description,
        position: mi,
        is_published: false,
      })
      .select("id")
      .single();
    if (!nm) continue;

    const { data: lessons } = await admin
      .from("lessons")
      .select("title, description, video_embed, lesson_type, is_free, position")
      .eq("module_id", mod.id)
      .order("position", { ascending: true });
    if (lessons && lessons.length > 0) {
      await admin.from("lessons").insert(
        lessons.map((l, i) => ({
          module_id: nm.id,
          title: l.title,
          description: l.description,
          video_embed: l.video_embed,
          lesson_type: l.lesson_type,
          is_free: l.is_free,
          is_published: false,
          position: i,
        }))
      );
    }
  }
  await logAudit(admin, actorId, "duplicate_course", { courseId, metadata: { newCourseId: newCourse.id } });
  revalidatePath("/admin/conteudo");
  return { ok: true, slug };
}

/** Arquiva/desarquiva um curso (esconde do aluno; preserva matrículas). */
export async function adminSetCourseArchived(courseId: string, archived: boolean) {
  let admin, actorId;
  try {
    ({ admin, userId: actorId } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin
    .from("courses")
    .update({
      status: archived ? "archived" : "published",
      is_published: !archived,
    })
    .eq("id", courseId);
  await logAudit(admin, actorId, archived ? "archive_course" : "unarchive_course", { courseId });
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Arquiva/desarquiva um módulo. */
export async function adminSetModuleArchived(moduleId: string, archived: boolean) {
  let admin, actorId;
  try {
    ({ admin, userId: actorId } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin.from("course_modules").update({ is_archived: archived }).eq("id", moduleId);
  await logAudit(admin, actorId, archived ? "archive_module" : "unarchive_module", { metadata: { moduleId } });
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Arquiva/desarquiva uma aula. */
export async function adminSetLessonArchived(lessonId: string, archived: boolean) {
  let admin, actorId;
  try {
    ({ admin, userId: actorId } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin.from("lessons").update({ is_archived: archived }).eq("id", lessonId);
  await logAudit(admin, actorId, archived ? "archive_lesson" : "unarchive_lesson", { metadata: { lessonId } });
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Admin atualiza uma aula (título, embed, tipo, gratuita, publicação). */
export async function adminUpdateLesson(input: {
  lessonId: string;
  title?: string;
  description?: string;
  videoEmbed?: string;
  lessonType?: string;
  isFree?: boolean;
  isPublished?: boolean;
}) {
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined)
    patch.description = input.description.trim() || null;
  if (input.videoEmbed !== undefined)
    patch.video_embed = input.videoEmbed.trim() || null;
  if (input.lessonType !== undefined) patch.lesson_type = input.lessonType;
  if (input.isFree !== undefined) patch.is_free = input.isFree;
  if (input.isPublished !== undefined) patch.is_published = input.isPublished;

  await admin.from("lessons").update(patch).eq("id", input.lessonId);
  revalidatePath("/admin/conteudo");
  return { ok: true };
}
