import { CreatePasswordForm } from "@/components/auth/create-password-form";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: `Criar senha — ${APP_NAME}` };

/**
 * Página acessada via link seguro (recuperação de senha OU primeiro acesso
 * após pagamento confirmado). O Supabase entrega uma sessão temporária pelo
 * link; aqui o aluno define a própria senha. Nunca enviamos senha fixa.
 */
export default function CriarSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface/70 backdrop-blur-md p-8">
        <h1 className="text-xl font-semibold">Criar nova senha</h1>
        <p className="mt-2 text-sm text-muted">
          Defina uma senha para acessar a {APP_NAME}.
        </p>
        <CreatePasswordForm />
      </div>
    </div>
  );
}
