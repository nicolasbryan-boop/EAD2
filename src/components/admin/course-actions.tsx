"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminDuplicateCourse,
  adminSetCourseArchived,
} from "@/lib/actions/admin";

export function CourseActions({
  courseId,
  archived,
}: {
  courseId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await adminDuplicateCourse(courseId);
            if (res.ok && "slug" in res) router.push(`/admin/conteudo?course=${res.slug}`);
            else router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
        Duplicar curso
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await adminSetCourseArchived(courseId, !archived);
            router.refresh();
          })
        }
      >
        {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
        {archived ? "Desarquivar curso" : "Arquivar curso"}
      </Button>
    </div>
  );
}
