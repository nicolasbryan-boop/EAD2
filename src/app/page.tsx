import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Entrada do app: manda para o dashboard se logado, senão para o login. */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/inicio" : "/login");
}
