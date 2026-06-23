"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  isUpsellSlug,
  isMainPackageSlug,
  UPSELL_REQUIRES_MAIN_MESSAGE,
} from "@/lib/constants";

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

  // Regra: upsell só pode entrar se já houver um pacote principal no carrinho.
  if (isUpsellSlug(packageSlug)) {
    const { data: existing } = await ctx.supabase
      .from("cart_items")
      .select("package_slug")
      .eq("cart_id", ctx.cartId);
    const hasMain = (existing ?? []).some((i) =>
      isMainPackageSlug(i.package_slug)
    );
    if (!hasMain) {
      return { ok: false, error: UPSELL_REQUIRES_MAIN_MESSAGE };
    }
  }

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

  // Se removeu um pacote principal e não sobrou nenhum, remove os upsells
  // (a oferta especial não pode ficar sozinha no carrinho).
  if (isMainPackageSlug(packageSlug)) {
    const { data: remaining } = await ctx.supabase
      .from("cart_items")
      .select("package_slug")
      .eq("cart_id", ctx.cartId);
    const hasMain = (remaining ?? []).some((i) =>
      isMainPackageSlug(i.package_slug)
    );
    if (!hasMain) {
      const upsellSlugs = (remaining ?? [])
        .map((i) => i.package_slug)
        .filter((s) => isUpsellSlug(s));
      if (upsellSlugs.length > 0) {
        await ctx.supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", ctx.cartId)
          .in("package_slug", upsellSlugs);
      }
    }
  }

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
