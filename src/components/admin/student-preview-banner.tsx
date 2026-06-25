import { Eye, ArrowLeft } from "lucide-react";
import { exitStudentPreview } from "@/lib/actions/preview";

/** Faixa fixa indicando que o admin está vendo a plataforma como aluno. */
export function StudentPreviewBanner() {
  return (
    <form
      action={exitStudentPreview}
      className="sticky top-0 z-40 flex items-center justify-center gap-3 border-b border-primary/40 bg-primary/15 px-4 py-2 text-sm backdrop-blur-md"
    >
      <Eye className="h-4 w-4 text-primary" />
      <span>Você está visualizando a plataforma como aluno.</span>
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar ao admin
      </button>
    </form>
  );
}
