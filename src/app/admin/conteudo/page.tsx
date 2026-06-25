import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CreateCourseForm,
  CourseSettingsForm,
} from "@/components/admin/content-forms";
import { CourseBuilder, type BModule } from "@/components/admin/course-builder";
import { requireAdmin } from "@/lib/admin";
import { formatBRL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata = { title: "Conteúdo — Admin" };

export default async function AdminConteudo({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: courseSlug } = await searchParams;
  const { admin } = await requireAdmin();

  const { data: courses } = await admin
    .from("courses")
    .select(
      "id, slug, title, price_cents, is_published, cover_image_url, short_description"
    )
    .order("position", { ascending: true });

  const list = courses ?? [];
  const selected =
    list.find((c) => c.slug === courseSlug) ?? list[0] ?? null;

  const { data: modules } = selected
    ? await admin
        .from("course_modules")
        .select("id, title, position")
        .eq("course_id", selected.id)
        .order("position", { ascending: true })
    : { data: [] };

  const { data: lessons } = selected
    ? await admin
        .from("lessons")
        .select("id, module_id, title, video_embed, lesson_type, is_free, position")
        .order("position", { ascending: true })
    : { data: [] };

  // Monta a árvore para o construtor.
  const tree: BModule[] = (modules ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    lessons: (lessons ?? [])
      .filter((l) => l.module_id === m.id)
      .map((l) => ({
        id: l.id,
        title: l.title,
        videoEmbed: l.video_embed ?? "",
        lessonType: l.lesson_type ?? "video",
        isFree: l.is_free ?? false,
      })),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Conteúdo</h1>

      {/* Criar curso */}
      <Card>
        <CardTitle>Novo curso</CardTitle>
        <CardDescription className="mb-3">
          Crie um curso e defina o preço de venda (R$).
        </CardDescription>
        <CreateCourseForm />
      </Card>

      {/* Seletor de curso */}
      {list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/admin/conteudo?course=${c.slug}`}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm transition-colors",
                selected?.id === c.id
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border text-muted hover:bg-surface-2"
              )}
            >
              {c.title}
              <span className="ml-2 text-xs text-muted">
                {c.price_cents > 0 ? formatBRL(c.price_cents) : "grátis"}
              </span>
            </Link>
          ))}
        </div>
      )}

      {!selected ? (
        <Card>
          <CardDescription>Nenhum curso ainda. Crie o primeiro acima.</CardDescription>
        </Card>
      ) : (
        <>
          {/* Configurações do curso: preço, capa, descrição, publicação */}
          <Card>
            <CardTitle className="mb-3">Configurações de “{selected.title}”</CardTitle>
            <CourseSettingsForm
              courseId={selected.id}
              priceCents={selected.price_cents}
              coverImageUrl={selected.cover_image_url ?? ""}
              shortDescription={selected.short_description ?? ""}
              isPublished={selected.is_published}
            />
          </Card>

          {/* Construtor de curso: arrastar, reordenar, mover entre módulos */}
          <Card>
            <CardTitle className="mb-3">Construtor — “{selected.title}”</CardTitle>
            <CourseBuilder courseId={selected.id} initialModules={tree} />
          </Card>
        </>
      )}
    </div>
  );
}
