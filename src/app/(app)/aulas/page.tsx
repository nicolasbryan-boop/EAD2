import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = { title: "Aulas — Trilogia do Sucesso" };

export default function AulasPage() {
  return (
    <div>
      <PageHeader
        title="Suas aulas"
        subtitle="Continue sua jornada de aprendizado. Assista às aulas no seu ritmo, acompanhe seu progresso e avance para os próximos módulos."
      />
      <Card>
        <CardTitle>Em construção (Fase 2)</CardTitle>
        <CardDescription>
          Aqui virão o card &quot;Continuar de onde parou&quot;, a lista de
          módulos e as aulas com progresso.
        </CardDescription>
      </Card>
    </div>
  );
}
