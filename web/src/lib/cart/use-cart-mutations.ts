"use client";

import type { CartDeleteResult, CartMutationResult } from "@/lib/auth/actions";
import type { CartWrite } from "@/lib/auth/contract";
import { readSignedInFromDocument } from "@/lib/auth/session";
import { deleteCart, replaceCart } from "@/lib/cart/browser";
import { useCartStore } from "@/lib/cart/store";
import {
  planAfterClear,
  planAfterRemove,
  planAfterSetQuantity,
  type CartSyncPlan,
} from "@/lib/cart/write";

export type CartMutateFn = (body: CartWrite) => Promise<CartMutationResult>;
export type CartDeleteFn = () => Promise<CartDeleteResult>;

/**
 * Quantity / remove / clear for the drawer and cart page (021 AC-12, AC-13).
 * Signed-in: PUT/DELETE via `/api/cart` JSON proxy.
 */
export function useCartMutations(deps?: {
  isSignedIn?: () => boolean;
  replaceCart?: CartMutateFn;
  deleteCart?: CartDeleteFn;
}) {
  const setQuantityLocal = useCartStore((state) => state.setQuantity);
  const removeLocal = useCartStore((state) => state.remove);
  const clearLocal = useCartStore((state) => state.clear);
  const applyServerCart = useCartStore((state) => state.applyServerCart);
  const isSignedIn = deps?.isSignedIn ?? readSignedInFromDocument;
  const replace = deps?.replaceCart ?? replaceCart;
  const removeRemote = deps?.deleteCart ?? deleteCart;

  async function applyPlan(plan: CartSyncPlan | null) {
    if (!plan) return;
    if (plan.action === "delete") {
      const result = await removeRemote();
      if (!result.ok) return;
      applyServerCart(null);
      return;
    }
    const result = await replace(plan.body);
    if (!result.ok) return;
    applyServerCart(result.cart);
  }

  return {
    setQuantity: async (productId: string, quantity: number) => {
      if (!isSignedIn()) {
        setQuantityLocal(productId, quantity);
        return;
      }
      const { items } = useCartStore.getState();
      await applyPlan(planAfterSetQuantity(items, productId, quantity));
    },

    remove: async (productId: string) => {
      if (!isSignedIn()) {
        removeLocal(productId);
        return;
      }
      const { items } = useCartStore.getState();
      await applyPlan(planAfterRemove(items, productId));
    },

    clear: async () => {
      if (!isSignedIn()) {
        clearLocal();
        return;
      }
      const { items } = useCartStore.getState();
      await applyPlan(planAfterClear(items));
    },
  };
}
