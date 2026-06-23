"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Garante que o usuário tem um carrinho e retorna o id. */
async function ensureCart(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; userId: string; cartId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { supabase, userId: user.id, cartId: existing.id };

  const { data: created } = await supabase
    .from("carts")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (!created) return null;
  return { supabase, userId: user.id, cartId: created.id };
}

/** Adiciona um pacote ao carrinho (incrementa quantidade se já existir). */
export async function addToCart(packageSlug: string) {
  const ctx = await ensureCart();
  if (!ctx) return { ok: false, error: "Sessão expirada." };

  // Confere se o pacote existe.
  const { data: pkg } = await ctx.supabase
    .from("credit_packages")
    .select("slug")
    .eq("slug", packageSlug)
    .maybeSingle();
  if (!pkg) return { ok: false, error: "Pacote inválido." };

  const { data: item } = await ctx.supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", ctx.cartId)
    .eq("package_slug", packageSlug)
    .maybeSingle();

  if (item) {
    await ctx.supabase
      .from("cart_items")
      .update({ quantity: item.quantity + 1 })
      .eq("id", item.id);
  } else {
    await ctx.supabase
      .from("cart_items")
      .insert({ cart_id: ctx.cartId, package_slug: packageSlug, quantity: 1 });
  }

  revalidatePath("/carrinho");
  return { ok: true };
}

/** Remove um pacote do carrinho. */
export async function removeFromCart(packageSlug: string) {
  const ctx = await ensureCart();
  if (!ctx) return { ok: false, error: "Sessão expirada." };

  await ctx.supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", ctx.cartId)
    .eq("package_slug", packageSlug);

  revalidatePath("/carrinho");
  return { ok: true };
}

/** Esvazia o carrinho (botão Cancelar). */
export async function clearCart() {
  const ctx = await ensureCart();
  if (!ctx) return { ok: false, error: "Sessão expirada." };

  await ctx.supabase.from("cart_items").delete().eq("cart_id", ctx.cartId);
  revalidatePath("/carrinho");
  return { ok: true };
}
