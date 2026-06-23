import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { ACHIEVEMENTS } from "@/lib/constants";
import { Trophy } from "lucide-react";

export const metadata = { title: "Sua conta — Trilogia do Sucesso" };

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      <PageHeader title="Sua conta" subtitle="Gerencie seu perfil e veja suas conquistas." />

      <Card>
        <CardTitle>Perfil</CardTitle>
        <CardDescription className="mb-4">
          Edição de foto, nome e senha chega na Fase 3.
        </CardDescription>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-muted">E-mail</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Plano atual</dt>
            <dd>—</dd>
          </div>
          <div>
            <dt className="text-muted">Créditos disponíveis</dt>
            <dd>0</dd>
          </div>
        </dl>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Conquistas</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => (
            <Card key={a.slug} className="flex items-start gap-3 opacity-60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted">{a.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
