import { createClient } from "@/lib/supabase/server";

export type CartItem = {
  slug: string;
  name: string;
  credits: number;
  priceCents: number;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
  totalCents: number;
  totalCredits: number;
};

/** Carrega o carrinho do usuário logado com os detalhes dos pacotes. */
export async function getCart(): Promise<Cart> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], totalCents: 0, totalCredits: 0 };

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) return { items: [], totalCents: 0, totalCredits: 0 };

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
    };
  });

  const totalCents = items.reduce(
    (s, i) => s + i.priceCents * i.quantity,
    0
  );
  const totalCredits = items.reduce((s, i) => s + i.credits * i.quantity, 0);

  return { items, totalCents, totalCredits };
}
