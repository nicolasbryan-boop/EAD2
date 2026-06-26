export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
};

export type CourseModule = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_embed: string | null;
  position: number;
  is_locked: boolean;
};

export type LessonProgress = {
  lesson_id: string;
  completed: boolean;
};

/** Aula achatada com info do módulo/curso e estado de progresso. */
export type LessonView = Lesson & {
  completed: boolean;
};

export type ModuleWithLessons = CourseModule & {
  lessons: LessonView[];
  /** Bloqueado por liberação programada (Fase 2). */
  locked?: boolean;
  /** Texto "será liberado em ..." quando bloqueado. */
  releaseLabel?: string | null;
};
