"use client";

import { useTranslations } from "next-intl";

import type { Product } from "@/lib/api/contract";
import { useCartStore } from "@/lib/cart/store";
import { useUiStore } from "@/lib/ui/store";

/**
 * T081 · AC-5. Adding always does three things: persist the line, open the
 * drawer, and announce with a toast. One helper so the card and the product
 * page cannot drift.
 */
export function useAddToCart() {
  const t = useTranslations();
  const add = useCartStore((state) => state.add);
  const open = useUiStore((state) => state.open);
  const pushToast = useUiStore((state) => state.pushToast);

  return (product: Product, quantity = 1) => {
    add(product, quantity);
    open("cart");
    pushToast(t("cart.added"));
  };
}
