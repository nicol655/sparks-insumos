"use client";

import { useTranslations } from "next-intl";

import type { Product } from "@/lib/api/contract";
import type { CartMutationResult } from "@/lib/auth/actions";
import type { CartWrite } from "@/lib/auth/contract";
import { readSignedInFromDocument } from "@/lib/auth/session";
import { createCart, replaceCart } from "@/lib/cart/browser";
import { useCartStore } from "@/lib/cart/store";
import { cartWriteAfterAdd } from "@/lib/cart/write";
import { useUiStore } from "@/lib/ui/store";

export type CartMutateFn = (body: CartWrite) => Promise<CartMutationResult>;

/**
 * T081 / 021 · AC-5 + AC-11. Persist the line, open the drawer, toast.
 * Signed-in shoppers POST or PUT `/api/cart` (JSON proxy); guests keep local.
 */
export function useAddToCart(deps?: {
  isSignedIn?: () => boolean;
  createCart?: CartMutateFn;
  replaceCart?: CartMutateFn;
}) {
  const t = useTranslations();
  const add = useCartStore((state) => state.add);
  const applyServerCart = useCartStore((state) => state.applyServerCart);
  const open = useUiStore((state) => state.open);
  const pushToast = useUiStore((state) => state.pushToast);
  const isSignedIn = deps?.isSignedIn ?? readSignedInFromDocument;
  const create = deps?.createCart ?? createCart;
  const replace = deps?.replaceCart ?? replaceCart;

  return async (product: Product, quantity = 1) => {
    if (!isSignedIn()) {
      add(product, quantity);
      open("cart");
      pushToast(t("cart.added"));
      return;
    }

    const { items, cartId } = useCartStore.getState();
    const body = cartWriteAfterAdd(items, product, quantity);
    if (!body) return;

    const result = cartId
      ? await replace(body)
      : await createThenMaybeReplace(body, create, replace);

    if (!result.ok) {
      pushToast(t("cart.syncFailed"));
      return;
    }

    applyServerCart(result.cart);
    open("cart");
    pushToast(t("cart.added"));
  };
}

async function createThenMaybeReplace(
  body: CartWrite,
  createCartFn: CartMutateFn,
  replaceCartFn: CartMutateFn,
): Promise<CartMutationResult> {
  const created = await createCartFn(body);
  if (created.ok || created.code !== "conflict") return created;
  return replaceCartFn(body);
}
