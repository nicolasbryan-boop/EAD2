import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CONFIG = {
  sucesso: {
    icon: CheckCircle2,
    color: "text-success bg-success/15",
    title: "Pagamento aprovado!",
    desc: "Seus créditos serão adicionados à sua conta em instantes (assim que confirmarmos o pagamento). Atualize o saldo na IA ou na sua conta.",
  },
  pendente: {
    icon: Clock,
    color: "text-warning bg-warning/15",
    title: "Pagamento pendente",
    desc: "Estamos aguardando a confirmação do pagamento. Assim que for aprovado, seus créditos entram automaticamente.",
  },
  falha: {
    icon: XCircle,
    color: "text-danger bg-danger/15",
    title: "Pagamento não concluído",
    desc: "Não foi possível concluir o pagamento. Você pode tentar novamente pelo carrinho.",
  },
} as const;

export function CheckoutResult({ status }: { status: keyof typeof CONFIG }) {
  const c = CONFIG[status];
  const Icon = c.icon;
  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="flex flex-col items-center py-10 text-center">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.color}`}>
          <Icon className="h-7 w-7" />
        </div>
        <CardTitle className="mt-4 text-xl">{c.title}</CardTitle>
        <CardDescription className="mt-2 max-w-sm">{c.desc}</CardDescription>
        <div className="mt-6 flex gap-3">
          <Link href="/inicio">
            <Button variant="outline">Ir para o início</Button>
          </Link>
          <Link href="/creditos">
            <Button>Comprar créditos</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
