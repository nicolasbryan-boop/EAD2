import Link from "next/link";
import { Coins, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RemoveItemButton,
  AddUpsellButton,
  CheckoutButtons,
} from "@/components/cart/cart-actions";
import { getCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/constants";

export const metadata = { title: "Carrinho — Trilogia do Sucesso" };

const UPSELL_SLUG = "upsell-1000";

export default async function CarrinhoPage() {
  const cart = await getCart();

  // Busca a oferta de upsell (pacote não listado na grade).
  const supabase = await createClient();
  const { data: upsell } = await supabase
    .from("credit_packages")
    .select("slug, name, credits, price_cents")
    .eq("slug", UPSELL_SLUG)
    .maybeSingle();

  const hasUpsell = cart.items.some((i) => i.slug === UPSELL_SLUG);

  if (cart.items.length === 0) {
    return (
      <div>
        <PageHeader title="Carrinho" subtitle="Revise seu pedido antes de finalizar." />
        <Card className="flex flex-col items-center py-12 text-center">
          <CardTitle>Seu carrinho está vazio</CardTitle>
          <CardDescription className="mt-1">
            Escolha um pacote de créditos para começar.
          </CardDescription>
          <Link href="/creditos" className="mt-4">
            <Button>Ver pacotes</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Carrinho" subtitle="Revise seu pedido antes de finalizar." />

      {/* Itens */}
      <Card className="divide-y divide-border p-0">
        {cart.items.map((item) => (
          <div key={item.slug} className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Coins className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted">
                {item.credits.toLocaleString("pt-BR")} créditos × {item.quantity}
              </p>
            </div>
            <span className="text-sm font-medium">
              {formatBRL(item.priceCents * item.quantity)}
            </span>
            <RemoveItemButton slug={item.slug} />
          </div>
        ))}
      </Card>

      {/* Upsell */}
      {upsell && !hasUpsell && (
        <Card className="flex flex-col gap-3 border-primary/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Oferta especial</CardTitle>
              <CardDescription>
                Adicione +{upsell.credits.toLocaleString("pt-BR")} créditos por
                apenas {formatBRL(upsell.price_cents)}.
              </CardDescription>
            </div>
          </div>
          <AddUpsellButton slug={UPSELL_SLUG} />
        </Card>
      )}

      {/* Total + ações */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted">Total de créditos</span>
          <span className="font-medium">
            {cart.totalCredits.toLocaleString("pt-BR")}
          </span>
        </div>
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">{formatBRL(cart.totalCents)}</span>
        </div>
        <CheckoutButtons />
        <p className="text-center text-xs text-muted">
          Os créditos são adicionados à sua conta após a confirmação do
          pagamento.
        </p>
      </Card>
    </div>
  );
}
