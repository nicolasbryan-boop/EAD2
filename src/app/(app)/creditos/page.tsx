import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKAGES, formatBRL } from "@/lib/constants";
import { Coins } from "lucide-react";

export const metadata = { title: "Comprar créditos — Trilogia do Sucesso" };

export default function CreditosPage() {
  return (
    <div>
      <PageHeader
        title="Comprar créditos"
        subtitle="Escolha um pacote para usar nas suas IAs."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CREDIT_PACKAGES.map((pkg) => (
          <Card key={pkg.slug} className="flex flex-col">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Coins className="h-5 w-5" />
            </div>
            <CardTitle className="mt-4">{pkg.name}</CardTitle>
            <p className="mt-1 text-2xl font-semibold">
              {pkg.credits.toLocaleString("pt-BR")}{" "}
              <span className="text-sm font-normal text-muted">créditos</span>
            </p>
            <p className="mt-1 text-sm text-muted">{formatBRL(pkg.priceCents)}</p>
            {/* O fluxo carrinho → checkout externo chega na Fase 5. */}
            <Button className="mt-4" disabled>
              Selecionar
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
