import { createClient } from "@/lib/supabase/server";
import { isUpsellSlug } from "@/lib/constants";

export type CartItem = {
  slug: string;
  name: string;
  credits: number;
  priceCents: number;
  quantity: number;
  isUpsell: boolean;
};

export type Cart = {
  items: CartItem[];
  totalCents: number;
  totalCredits: number;
  /** Tem ao menos um pacote principal (não-upsell)? */
  hasMainPackage: boolean;
  /** Carrinho contém apenas itens de upsell (estado inválido p/ compra). */
  onlyUpsell: boolean;
};

/** Carrega o carrinho do usuário logado com os detalhes dos pacotes. */
export async function getCart(): Promise<Cart> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const empty: Cart = {
    items: [],
    totalCents: 0,
    totalCredits: 0,
    hasMainPackage: false,
    onlyUpsell: false,
  };
  if (!user) return empty;

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) return empty;

  const { data: rows } = await supabase
    .from("cart_items")
    .select("package_slug, quantity, credit_packages(name, credits, price_cents)")
    .eq("cart_id", cart.id);

  const items: CartItem[] = (rows ?? []).map((r) => {
    const pkg = r.credit_packages as unknown as {
      name: string;
      credits: number;
      price_cents: number;
    };
    return {
      slug: r.package_slug,
      name: pkg.name,
      credits: pkg.credits,
      priceCents: pkg.price_cents,
      quantity: r.quantity,
      isUpsell: isUpsellSlug(r.package_slug),
    };
  });

  const totalCents = items.reduce(
    (s, i) => s + i.priceCents * i.quantity,
    0
  );
  const totalCredits = items.reduce((s, i) => s + i.credits * i.quantity, 0);
  const hasMainPackage = items.some((i) => !i.isUpsell);
  const onlyUpsell = items.length > 0 && !hasMainPackage;

  return { items, totalCents, totalCredits, hasMainPackage, onlyUpsell };
}
