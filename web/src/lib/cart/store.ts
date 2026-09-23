import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Locale } from "@/i18n/locales";
import type { Product } from "@/lib/api/contract";
import type { CatalogRepository } from "@/lib/api/repository";

/**
 * RF-5 · cart state, persisted so it survives a reload and a language switch
 * (AC-15).
 *
 * Storage holds references only — product, slug, quantity. Prices are read
 * back from the repository every time the cart is rendered, so an old cart can
 * never freeze an outdated price, and nothing locale-dependent is written to
 * disk. Whatever comes out of localStorage is untrusted and goes through Zod.
 */
/** Sanity cap on hand-edited storage; real limits come from stock. */
const MAX_QUANTITY = 99;

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
});

export type CartItem = z.infer<typeof cartItemSchema>;

const persistedSchema = z.object({ items: z.array(cartItemSchema) });

/** A cart item joined with its current product data. */
export type CartLine = {
  productId: string;
  slug: string;
  product: Product;
  /** Already clamped to available stock. */
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ResolvedCart = {
  lines: CartLine[];
  /** Items whose product disappeared or sold out; the UI tells the shopper. */
  unavailable: CartItem[];
  subtotal: number;
  count: number;
};

type CartState = {
  items: CartItem[];
  /** False until persisted state has been read back on the client. */
  hydrated: boolean;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "sparks.cart";

function clamp(quantity: number): number {
  return Math.max(1, Math.min(Math.trunc(quantity), MAX_QUANTITY));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,

      add: (product, quantity = 1) =>
        set((state) => {
          if (product.stock <= 0) return state;

          const existing = state.items.find((item) => item.productId === product.id);
          const wanted = clamp((existing?.quantity ?? 0) + quantity);
          const capped = Math.min(wanted, product.stock);

          if (!existing) {
            return {
              items: [...state.items, { productId: product.id, slug: product.slug, quantity: capped }],
            };
          }

          return {
            items: state.items.map((item) =>
              item.productId === product.id ? { ...item, quantity: capped } : item,
            ),
          };
        }),

      setQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.productId !== productId) };
          }

          return {
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity: clamp(quantity) } : item,
            ),
          };
        }),

      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      // Hydrating during render would make the server-rendered badge (always
      // empty) disagree with the client. A provider triggers it in an effect.
      skipHydration: true,
      merge: (persisted, current) => {
        const parsed = persistedSchema.safeParse(persisted);

        // A corrupt or tampered cart is discarded rather than half-loaded.
        return { ...current, items: parsed.success ? dedupe(parsed.data.items) : [] };
      },
    },
  ),
);

/** Called by the cart provider inside an effect, after the first paint. */
export async function rehydrateCart(): Promise<void> {
  await useCartStore.persist.rehydrate();
  useCartStore.setState({ hydrated: true });
}

function dedupe(items: CartItem[]): CartItem[] {
  const byProduct = new Map<string, CartItem>();

  for (const item of items) {
    const existing = byProduct.get(item.productId);
    byProduct.set(
      item.productId,
      existing ? { ...existing, quantity: clamp(existing.quantity + item.quantity) } : item,
    );
  }

  return [...byProduct.values()];
}

/**
 * Joins the stored references with live product data. Sold-out and vanished
 * products are reported separately instead of silently disappearing.
 */
export async function resolveCart(
  items: CartItem[],
  repository: CatalogRepository,
  locale: Locale,
): Promise<ResolvedCart> {
  const products = await Promise.all(items.map((item) => repository.getProduct(item.slug, locale)));

  const lines: CartLine[] = [];
  const unavailable: CartItem[] = [];

  items.forEach((item, index) => {
    const product = products[index];

    if (!product || product.stock <= 0) {
      unavailable.push(item);
      return;
    }

    const quantity = Math.min(item.quantity, product.stock);

    lines.push({
      productId: item.productId,
      slug: item.slug,
      product,
      quantity,
      unitPrice: product.price.amount,
      lineTotal: product.price.amount * quantity,
    });
  });

  return {
    lines,
    unavailable,
    subtotal: lines.reduce((total, line) => total + line.lineTotal, 0),
    count: lines.reduce((total, line) => total + line.quantity, 0),
  };
}

/**
 * Units in the cart straight from storage. The header badge uses this so it can
 * render without waiting for a request.
 */
export function cartCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}
