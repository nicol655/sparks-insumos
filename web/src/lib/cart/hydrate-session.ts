import type { Cart } from "@/lib/auth/contract";
import { readSignedInFromDocument } from "@/lib/auth/session";
import { rehydrateCart, useCartStore } from "@/lib/cart/store";

export type SessionCartLoadResult =
  | { ok: true; signedIn: false }
  | { ok: true; signedIn: true; cart: Cart | null }
  | { ok: false; code: "unauthorized" | "unavailable" };

export type LoadSessionCart = () => Promise<SessionCartLoadResult>;

/**
 * Guest: rehydrate localStorage. Signed-in: always GET `/me` and replace the
 * store (ADR-0029) so another tab/browser that mutated the cart is reflected.
 * After logout, clears server flags and rehydrates local.
 */
export async function hydrateCartSession(load: LoadSessionCart): Promise<void> {
  if (!readSignedInFromDocument()) {
    if (useCartStore.getState().serverReady) {
      useCartStore.setState({ serverReady: false, cartId: null });
    }
    await rehydrateCart();
    return;
  }

  const result = await load();
  if (result.ok && !result.signedIn) {
    await rehydrateCart();
    return;
  }
  if (!result.ok) {
    if (result.code === "unauthorized") {
      useCartStore.setState({ serverReady: false, cartId: null });
      await rehydrateCart();
      return;
    }
    // Keep any existing server cart; still unlock the badge.
    useCartStore.setState({ hydrated: true, serverReady: true });
    return;
  }

  useCartStore.getState().applyServerCart(result.cart);
}
