"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin";

const COOKIE = "va_student";

/** Admin entra no modo "ver como aluno" (não perde o acesso admin). */
export async function enterStudentPreview() {
  if (!(await isCurrentUserAdmin())) return;
  (await cookies()).set(COOKIE, "1", { path: "/", httpOnly: false });
  redirect("/inicio");
}

/** Sai do modo de pré-visualização e volta ao painel. */
export async function exitStudentPreview() {
  (await cookies()).delete(COOKIE);
  redirect("/admin");
}
