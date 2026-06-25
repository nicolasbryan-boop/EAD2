/**
 * Normaliza a entrada de vídeo. Para YouTube (watch?v=, youtu.be, /live/,
 * shorts), extrai o ID e devolve a URL de embed. Para outros provedores
 * (Panda, VTurb, iframe custom), devolve o que foi colado.
 */
export function toVideoEmbed(input: string): string {
  const v = input.trim();
  if (!v) return v;

  const yt =
    v.match(/(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  return v;
}

export const LESSON_TYPES = [
  { value: "video", label: "Vídeo incorporado" },
  { value: "youtube", label: "YouTube" },
  { value: "youtube_live", label: "YouTube Live" },
  { value: "panda", label: "Panda Video" },
  { value: "vturb", label: "VTurb" },
  { value: "text", label: "Texto" },
  { value: "pdf", label: "PDF" },
  { value: "file", label: "Arquivo" },
  { value: "link", label: "Link externo" },
] as const;
