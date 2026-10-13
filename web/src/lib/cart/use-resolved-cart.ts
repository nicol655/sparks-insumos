"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

import type { Locale } from "@/i18n/locales";
import { resolveCartLines } from "@/lib/cart/browser";
import { useCartStore, type CartItem, type ResolvedCart } from "@/lib/cart/store";

const EMPTY: ResolvedCart = { lines: [], unavailable: [], subtotal: 0, count: 0 };

export type ResolvedCartView = {
  cart: ResolvedCart;
  /** False until the first join with the catalogue finishes. */
  ready: boolean;
};

export type ResolveCartFn = (items: CartItem[], locale: Locale) => Promise<ResolvedCart>;

/**
 * Joins persisted cart references with live catalogue data on the client.
 *
 * Resolution POSTs `/api/cart/resolve` (JSON) so the browser never talks to
 * the Docker-only `API_BASE_URL` and DevTools shows a real JSON body.
 */
export function useResolvedCart(deps?: { resolve?: ResolveCartFn }): ResolvedCartView {
  const items = useCartStore((state) => state.items);
  const locale = useLocale() as Locale;
  const resolve = deps?.resolve ?? resolveCartLines;
  const [resolved, setResolved] = useState<ResolvedCart>(EMPTY);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;

    let cancelled = false;

    void resolve(items, locale)
      .then((next) => {
        if (!cancelled) {
          setResolved(next);
          setJoined(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolved({ ...EMPTY, unavailable: items });
          setJoined(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [items, locale, resolve]);

  if (items.length === 0) {
    return { cart: EMPTY, ready: true };
  }

  return { cart: resolved, ready: joined };
}
