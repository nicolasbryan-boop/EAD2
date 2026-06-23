import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME, EXTERNAL_CHECKOUT_URL } from "@/lib/constants";

export const metadata = { title: `Entrar — ${APP_NAME}` };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent" />
          <span className="text-lg font-semibold tracking-tight">
            {APP_NAME}
          </span>
        </div>

        <div className="rounded-3xl border border-border bg-surface/70 backdrop-blur-md p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold text-center">
            Bem-vindo à Trilogia do Sucesso
          </h1>
          <p className="mt-2 text-sm text-muted text-center">
            Entre na sua conta para continuar seus estudos e acessar suas IAs.
          </p>

          <LoginForm />

          <div className="mt-6 text-center text-sm text-muted">
            Não tem acesso?{" "}
            {/*
              Importante: "Comprar agora" NÃO cria conta grátis.
              Redireciona para o checkout externo (Mercado Pago/Hotmart/etc.).
              A conta só é liberada após pagamento confirmado via webhook.
            */}
            <a
              href={EXTERNAL_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              Comprar agora
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/recuperar-senha" className="hover:underline">
            Esqueci minha senha
          </Link>
        </p>
      </div>
    </div>
  );
}
