import { NextResponse } from "next/server";
import { getPayment } from "@/lib/gateways/mercadopago";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Webhook do Mercado Pago.
 *
 * SEGURANÇA / CONFIABILIDADE:
 *  - NÃO confiamos no corpo da notificação para o status. Apenas pegamos o
 *    id do pagamento e CONSULTAMOS a API do MP (fonte autoritativa).
 *  - Idempotência: gravamos o evento em payment_events com unique
 *    (provider, provider_event_id). Reentregas do MP não creditam duas vezes.
 *  - Crédito é concedido pela service role (ignora RLS) só aqui no servidor.
 *
 * Observação: para receber notificações o app precisa estar em uma URL
 * pública (deploy/ngrok). Em localhost o MP não consegue chamar este endpoint.
 */
export async function POST(req: Request) {
  // 1. Descobre o id do pagamento (suporta formato webhook e IPN).
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);

  const type =
    (body as { type?: string; topic?: string }).type ??
    url.searchParams.get("type") ??
    url.searchParams.get("topic");

  const paymentId =
    (body as { data?: { id?: string } }).data?.id ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id");

  // Só tratamos eventos de pagamento.
  if (type && type !== "payment") {
    return NextResponse.json({ ignored: true });
  }
  if (!paymentId) {
    return NextResponse.json({ ignored: "sem id" });
  }

  // 2. Consulta o pagamento na API do MP.
  const payment = await getPayment(String(paymentId));
  if (!payment) {
    // Não encontrado agora → peça retry ao MP.
    return NextResponse.json({ error: "pagamento não encontrado" }, { status: 404 });
  }

  const admin = createAdminClient();

  // 3. Idempotência: registra o evento; se já existir, ignora.
  const { error: evtErr } = await admin.from("payment_events").insert({
    provider: "mercadopago",
    event_type: "payment",
    provider_event_id: payment.id,
    order_id: payment.externalReference,
    raw: payment,
  });
  if (evtErr) {
    // 23505 = unique_violation → já processado.
    if (evtErr.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    // Outro erro de DB → retry.
    return NextResponse.json({ error: evtErr.message }, { status: 500 });
  }

  // 4. Só credita se aprovado e com pedido vinculado.
  if (payment.status !== "approved" || !payment.externalReference) {
    return NextResponse.json({ ok: true, status: payment.status });
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, credits_total, status")
    .eq("id", payment.externalReference)
    .maybeSingle();

  if (!order) return NextResponse.json({ ok: true, note: "pedido inexistente" });
  if (order.status === "paid")
    return NextResponse.json({ ok: true, note: "já pago" });

  // 5. Credita o aluno (atômico) e marca o pedido como pago.
  await admin.rpc("add_credits_for", {
    p_user_id: order.user_id,
    p_amount: order.credits_total,
    p_type: "purchase",
    p_reason: `order:${order.id}`,
  });

  await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      provider_payment_id: payment.id,
    })
    .eq("id", order.id);

  // 6. Esvazia o carrinho do comprador.
  const { data: cart } = await admin
    .from("carts")
    .select("id")
    .eq("user_id", order.user_id)
    .maybeSingle();
  if (cart) await admin.from("cart_items").delete().eq("cart_id", cart.id);

  return NextResponse.json({ ok: true, credited: order.credits_total });
}

// MP às vezes faz GET de verificação.
export async function GET() {
  return NextResponse.json({ ok: true });
}
