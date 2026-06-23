import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = { title: "Carrinho — Trilogia do Sucesso" };

export default function CarrinhoPage() {
  return (
    <div>
      <PageHeader title="Carrinho" subtitle="Revise seu pedido antes de finalizar." />
      <Card>
        <CardTitle>Em construção (Fase 5)</CardTitle>
        <CardDescription>
          Aqui virão os itens selecionados, o total, o upsell e o botão
          &quot;Comprar&quot; que redireciona ao checkout do Mercado Pago.
        </CardDescription>
      </Card>
    </div>
  );
}
