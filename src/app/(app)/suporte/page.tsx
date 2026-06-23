import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = { title: "Suporte — Trilogia do Sucesso" };

export default function SuportePage() {
  return (
    <div>
      <PageHeader
        title="Suporte"
        subtitle="Abra um chamado e acompanhe o status das suas solicitações."
      />
      <Card>
        <CardTitle>Em construção (Fase 6)</CardTitle>
        <CardDescription>
          Aqui virá o formulário de chamado (assunto, categoria, mensagem,
          anexo) e a lista dos seus chamados com status.
        </CardDescription>
      </Card>
    </div>
  );
}
