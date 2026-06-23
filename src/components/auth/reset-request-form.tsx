"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/criar-senha`,
    });
    // Mensagem genérica para não revelar se o e-mail existe.
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <p className="mt-6 text-sm text-success">
        Se este e-mail tiver uma conta, enviamos um link seguro para redefinir a
        senha. Verifique sua caixa de entrada.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="voce@email.com"
        className="w-full rounded-xl border border-border bg-surface-2 px-4 h-11 text-sm outline-none focus:ring-2 focus:ring-primary/60"
      />
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar link seguro
      </Button>
    </form>
  );
}
