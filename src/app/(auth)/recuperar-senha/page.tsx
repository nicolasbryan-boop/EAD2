import Link from "next/link";
import { ResetRequestForm } from "@/components/auth/reset-request-form";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: `Recuperar senha — ${APP_NAME}` };

export default function RecuperarSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface/70 backdrop-blur-md p-8">
        <h1 className="text-xl font-semibold">Recuperar senha</h1>
        <p className="mt-2 text-sm text-muted">
          Informe seu e-mail. Enviaremos um link seguro para você criar uma
          nova senha.
        </p>
        <ResetRequestForm />
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/login" className="hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
