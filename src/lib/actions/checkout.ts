"use server";

import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/cart";
import { createPreference } from "@/lib/gateways/mercadopago";

/**
 * Finaliza o carrinho: cria um pedido `pending` e uma preferência de
 * pagamento no Mercado Pago. Retorna a URL de checkout para redirecionar.
 * Os créditos só são adicionados depois, pelo webhook (pagamento aprovado).
 */
export async function startCheckout(): Promise<
  { ok: true; initPoint: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const cart = await getCart();
  if (cart.items.length === 0)
    return { ok: false, error: "Seu carrinho está vazio." };

  // 1. Cria o pedido (pending) com snapshot dos itens.
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      amount_cents: cart.totalCents,
      credits_total: cart.totalCredits,
      items: cart.items.map((i) => ({
        slug: i.slug,
        credits: i.credits,
        quantity: i.quantity,
        price_cents: i.priceCents,
      })),
      provider: "mercadopago",
    })
    .select("id")
    .single();

  if (error || !order)
    return { ok: false, error: "Falha ao criar o pedido." };

  // 2. Cria a preferência de pagamento.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const pref = await createPreference({
      orderId: order.id,
      siteUrl,
      payerEmail: user.email ?? undefined,
      items: cart.items.map((i) => ({
        title: i.name,
        quantity: i.quantity,
        unitPriceCents: i.priceCents,
      })),
    });

    await supabase
      .from("orders")
      .update({ provider_preference_id: pref.id })
      .eq("id", order.id);

    return { ok: true, initPoint: pref.initPoint };
  } catch (e) {
    await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Falha ao iniciar o checkout.",
    };
  }
}
