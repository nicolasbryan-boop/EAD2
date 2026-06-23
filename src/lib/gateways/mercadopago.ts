/**
 * Adaptador do Mercado Pago (Checkout Pro).
 * Tudo aqui roda SOMENTE no servidor — usa o MP_ACCESS_TOKEN secreto.
 * Outros gateways (Hotmart/Kiwify/Braip) podem seguir o mesmo formato.
 */
const MP_API = "https://api.mercadopago.com";

function token() {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN ausente.");
  return t;
}

export type PreferenceItem = {
  title: string;
  quantity: number;
  unitPriceCents: number;
};

/**
 * Cria uma preferência de pagamento e retorna a URL de checkout.
 * external_reference = id do nosso pedido (usado para creditar no webhook).
 */
export async function createPreference(opts: {
  orderId: string;
  items: PreferenceItem[];
  payerEmail?: string;
  siteUrl: string;
}): Promise<{ id: string; initPoint: string }> {
  // auto_return só com HTTPS público (MP rejeita localhost).
  const isHttps = opts.siteUrl.startsWith("https://");

  const body: Record<string, unknown> = {
    items: opts.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      currency_id: "BRL",
      unit_price: Number((i.unitPriceCents / 100).toFixed(2)),
    })),
    external_reference: opts.orderId,
    payer: opts.payerEmail ? { email: opts.payerEmail } : undefined,
    back_urls: {
      success: `${opts.siteUrl}/checkout/sucesso`,
      pending: `${opts.siteUrl}/checkout/pendente`,
      failure: `${opts.siteUrl}/checkout/falha`,
    },
    notification_url: `${opts.siteUrl}/api/webhooks/mercadopago`,
  };
  if (isHttps) body.auto_return = "approved";

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao criar preferência MP: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    // init_point funciona tanto em produção quanto em teste (token TEST-).
    initPoint: data.init_point ?? data.sandbox_init_point,
  };
}

export type MpPayment = {
  id: string;
  status: string; // approved, pending, rejected...
  externalReference: string | null;
};

/** Consulta um pagamento pelo id (fonte autoritativa do status). */
export async function getPayment(paymentId: string): Promise<MpPayment | null> {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: String(data.id),
    status: data.status,
    externalReference: data.external_reference ?? null,
  };
}
