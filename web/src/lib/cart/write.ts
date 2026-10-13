import type { Product } from "@/lib/api/contract";
import type { CartWrite } from "@/lib/auth/contract";
import type { CartItem } from "@/lib/cart/store";

const MAX_QUANTITY = 99;

function clamp(quantity: number): number {
  return Math.max(1, Math.min(Math.trunc(quantity), MAX_QUANTITY));
}

function toWrite(items: CartItem[]): CartWrite {
  return {
    items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
  };
}

/** Server sync after a local edit: replace lines or hard-delete the cart. */
export type CartSyncPlan = { action: "replace"; body: CartWrite } | { action: "delete" };

/**
 * Builds the full cart write body after adding `quantity` of `product`.
 * Returns null when the product is sold out (same rule as the local store).
 */
export function cartWriteAfterAdd(
  items: CartItem[],
  product: Product,
  quantity = 1,
): CartWrite | null {
  if (product.stock === 0) return null;

  const existing = items.find((item) => item.productId === product.id);
  const wanted = clamp((existing?.quantity ?? 0) + quantity);
  const capped = product.stock === null ? wanted : Math.min(wanted, product.stock);

  const next: CartItem[] = existing
    ? items.map((item) =>
        item.productId === product.id ? { ...item, quantity: capped, slug: product.slug } : item,
      )
    : [...items, { productId: product.id, slug: product.slug, quantity: capped }];

  return toWrite(next);
}

export function planAfterSetQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
): CartSyncPlan | null {
  if (!items.some((item) => item.productId === productId)) return null;

  if (quantity <= 0) {
    const next = items.filter((item) => item.productId !== productId);
    return next.length === 0 ? { action: "delete" } : { action: "replace", body: toWrite(next) };
  }

  const next = items.map((item) =>
    item.productId === productId ? { ...item, quantity: clamp(quantity) } : item,
  );
  return { action: "replace", body: toWrite(next) };
}

export function planAfterRemove(items: CartItem[], productId: string): CartSyncPlan | null {
  if (!items.some((item) => item.productId === productId)) return null;
  const next = items.filter((item) => item.productId !== productId);
  return next.length === 0 ? { action: "delete" } : { action: "replace", body: toWrite(next) };
}

export function planAfterClear(items: CartItem[]): CartSyncPlan | null {
  if (items.length === 0) return null;
  return { action: "delete" };
}
