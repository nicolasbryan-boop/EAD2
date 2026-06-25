"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Pencil,
  Check,
  Loader2,
  CircleDot,
  Copy,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toVideoEmbed, LESSON_TYPES } from "@/lib/video";
import {
  adminSaveCourseStructure,
  adminRenameModule,
  adminDeleteModule,
  adminDeleteLesson,
  adminCreateModule,
  adminCreateLesson,
  adminUpdateLesson,
  adminDuplicateModule,
  adminDuplicateLesson,
  adminSetModuleArchived,
  adminSetLessonArchived,
} from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

export type BLesson = {
  id: string;
  title: string;
  videoEmbed: string;
  lessonType: string;
  isFree: boolean;
  isArchived: boolean;
};
export type BModule = {
  id: string;
  title: string;
  isArchived: boolean;
  lessons: BLesson[];
};

export function CourseBuilder({
  courseId,
  initialModules,
}: {
  courseId: string;
  initialModules: BModule[];
}) {
  const router = useRouter();
  const [mods, setMods] = useState<BModule[]>(initialModules);
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const drag = useRef<{ lessonId: string; from: string } | null>(null);
  const [overModule, setOverModule] = useState<string | null>(null);

  /** Persiste a estrutura inteira (ordem + módulo de cada aula). */
  function persist(next: BModule[]) {
    setMods(next);
    startTransition(async () => {
      await adminSaveCourseStructure(
        courseId,
        next.map((m) => ({ id: m.id, lessonIds: m.lessons.map((l) => l.id) }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  function moveLesson(toModuleId: string, beforeLessonId: string | null) {
    const d = drag.current;
    drag.current = null;
    setOverModule(null);
    if (!d) return;
    const copy = mods.map((m) => ({ ...m, lessons: [...m.lessons] }));
    const from = copy.find((m) => m.id === d.from);
    if (!from) return;
    const i = from.lessons.findIndex((l) => l.id === d.lessonId);
    if (i < 0) return;
    const [lesson] = from.lessons.splice(i, 1);
    const to = copy.find((m) => m.id === toModuleId);
    if (!to) return;
    if (beforeLessonId && beforeLessonId !== d.lessonId) {
      const bi = to.lessons.findIndex((l) => l.id === beforeLessonId);
      to.lessons.splice(bi < 0 ? to.lessons.length : bi, 0, lesson);
    } else {
      to.lessons.push(lesson);
    }
    persist(copy);
  }

  function moveModule(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= mods.length) return;
    const copy = [...mods];
    [copy[index], copy[j]] = [copy[j], copy[index]];
    persist(copy);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Arraste as aulas para reordenar ou movê-las entre módulos.
        </p>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-success">
            <Check className="h-3.5 w-3.5" /> Estrutura salva
          </span>
        )}
      </div>

      {mods.map((mod, mi) => (
        <div
          key={mod.id}
          className={cn(
            "rounded-2xl border bg-surface/60 p-4 transition-colors",
            overModule === mod.id ? "border-primary/60" : "border-border",
            mod.isArchived && "opacity-60"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setOverModule(mod.id);
          }}
          onDrop={() => moveLesson(mod.id, null)}
        >
          <ModuleHeader
            module={mod}
            isFirst={mi === 0}
            isLast={mi === mods.length - 1}
            onUp={() => moveModule(mi, -1)}
            onDown={() => moveModule(mi, 1)}
            onRefresh={() => router.refresh()}
          />

          <div className="mt-3 space-y-2">
            {mod.lessons.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
                Sem aulas. Arraste uma aqui ou adicione abaixo.
              </p>
            )}
            {mod.lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                onDragStart={() => (drag.current = { lessonId: lesson.id, from: mod.id })}
                onDropBefore={() => moveLesson(mod.id, lesson.id)}
                onRefresh={() => router.refresh()}
              />
            ))}
          </div>

          <AddLessonInline moduleId={mod.id} onAdded={() => router.refresh()} />
        </div>
      ))}

      <AddModuleInline courseId={courseId} onAdded={() => router.refresh()} />
    </div>
  );
}

/* ----------------------------- Módulo ----------------------------- */
function ModuleHeader({
  module,
  isFirst,
  isLast,
  onUp,
  onDown,
  onRefresh,
}: {
  module: BModule;
  isFirst: boolean;
  isLast: boolean;
  onUp: () => void;
  onDown: () => void;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <input
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() =>
            start(async () => {
              await adminRenameModule(module.id, title);
              setEditing(false);
              onRefresh();
            })
          }
          className="flex-1 rounded-lg border border-border bg-surface-2 px-3 h-9 text-sm font-semibold outline-none"
        />
      ) : (
        <h3 className="flex-1 text-base font-semibold">{module.title}</h3>
      )}

      {module.isArchived && (
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
          arquivado
        </span>
      )}
      <button onClick={() => setEditing((v) => !v)} className="p-1.5 text-muted hover:text-foreground" title="Renomear">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={onUp} disabled={isFirst} className="p-1.5 text-muted hover:text-foreground disabled:opacity-30" title="Mover para cima">
        <ChevronUp className="h-4 w-4" />
      </button>
      <button onClick={onDown} disabled={isLast} className="p-1.5 text-muted hover:text-foreground disabled:opacity-30" title="Mover para baixo">
        <ChevronDown className="h-4 w-4" />
      </button>
      <button
        onClick={() => start(async () => { await adminDuplicateModule(module.id); onRefresh(); })}
        disabled={pending}
        className="p-1.5 text-muted hover:text-foreground"
        title="Duplicar módulo"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        onClick={() => start(async () => { await adminSetModuleArchived(module.id, !module.isArchived); onRefresh(); })}
        disabled={pending}
        className="p-1.5 text-muted hover:text-warning"
        title={module.isArchived ? "Desarquivar" : "Arquivar"}
      >
        {module.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
      </button>
      <button
        onClick={() => {
          if (
            confirm(
              `Excluir o módulo "${module.title}"? As aulas dentro dele também serão excluídas. (Dica: prefira arquivar.)`
            )
          )
            start(async () => {
              await adminDeleteModule(module.id);
              onRefresh();
            });
        }}
        disabled={pending}
        className="p-1.5 text-muted hover:text-danger"
        title="Excluir módulo"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ------------------------------ Aula ------------------------------ */
function LessonRow({
  lesson,
  onDragStart,
  onDropBefore,
  onRefresh,
}: {
  lesson: BLesson;
  onDragStart: () => void;
  onDropBefore: () => void;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [video, setVideo] = useState(lesson.videoEmbed);
  const [type, setType] = useState(lesson.lessonType);
  const [free, setFree] = useState(lesson.isFree);
  const [pending, start] = useTransition();
  const [over, setOver] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.stopPropagation();
        setOver(false);
        onDropBefore();
      }}
      className={cn(
        "rounded-xl border border-border bg-surface px-3 py-2 transition-colors",
        over && "border-primary/70"
      )}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 cursor-move text-muted" />
        <CircleDot className="h-3.5 w-3.5 text-primary/70" />
        <span className={cn("flex-1 truncate text-sm", lesson.isArchived && "opacity-60")}>
          {title}
        </span>
        {lesson.isArchived && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
            arquivada
          </span>
        )}
        {lesson.isFree && (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] text-success">
            grátis
          </span>
        )}
        <button onClick={() => setOpen((v) => !v)} className="p-1 text-muted hover:text-foreground" title="Editar">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => start(async () => { await adminDuplicateLesson(lesson.id); onRefresh(); })}
          disabled={pending}
          className="p-1 text-muted hover:text-foreground"
          title="Duplicar aula"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => start(async () => { await adminSetLessonArchived(lesson.id, !lesson.isArchived); onRefresh(); })}
          disabled={pending}
          className="p-1 text-muted hover:text-warning"
          title={lesson.isArchived ? "Desarquivar" : "Arquivar"}
        >
          {lesson.isArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => {
            if (confirm(`Excluir a aula "${lesson.title}"? (Dica: prefira arquivar.)`))
              start(async () => {
                await adminDeleteLesson(lesson.id);
                onRefresh();
              });
          }}
          className="p-1 text-muted hover:text-danger"
          title="Excluir aula"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da aula"
            className="w-full rounded-lg border border-border bg-surface-2 px-3 h-9 text-sm outline-none"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2 h-9 text-sm outline-none"
            >
              {LESSON_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="URL/embed do vídeo (YouTube vira embed automático)"
              className="flex-1 rounded-lg border border-border bg-surface-2 px-3 h-9 text-sm outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={free}
              onChange={(e) => setFree(e.target.checked)}
            />
            Aula gratuita (demonstração)
          </label>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await adminUpdateLesson({
                  lessonId: lesson.id,
                  title,
                  videoEmbed: toVideoEmbed(video),
                  lessonType: type,
                  isFree: free,
                });
                setOpen(false);
                onRefresh();
              })
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Salvar aula
          </Button>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Adicionar --------------------------- */
function AddLessonInline({
  moduleId,
  onAdded,
}: {
  moduleId: string;
  onAdded: () => void;
}) {
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nova aula neste módulo"
        className="flex-1 rounded-lg border border-border bg-surface-2 px-3 h-9 text-sm outline-none"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={pending || !title.trim()}
        onClick={() =>
          start(async () => {
            await adminCreateLesson({ moduleId, title });
            setTitle("");
            onAdded();
          })
        }
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Aula
      </Button>
    </div>
  );
}

function AddModuleInline({
  courseId,
  onAdded,
}: {
  courseId: string;
  onAdded: () => void;
}) {
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2 rounded-2xl border border-dashed border-border p-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Novo módulo"
        className="flex-1 rounded-lg border border-border bg-surface-2 px-3 h-10 text-sm outline-none"
      />
      <Button
        disabled={pending || !title.trim()}
        onClick={() =>
          start(async () => {
            await adminCreateModule(courseId, title);
            setTitle("");
            onAdded();
          })
        }
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Módulo
      </Button>
    </div>
  );
}
