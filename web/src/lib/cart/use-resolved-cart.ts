"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

import { catalogRepository } from "@/lib/api";
import { resolveCart, useCartStore, type ResolvedCart } from "@/lib/cart/store";
import type { Locale } from "@/i18n/locales";

const EMPTY: ResolvedCart = { lines: [], unavailable: [], subtotal: 0, count: 0 };

export type ResolvedCartView = {
  cart: ResolvedCart;
  /** False until the first join with the catalogue finishes. */
  ready: boolean;
};

/**
 * Joins persisted cart references with live catalogue data on the client.
 *
 * The drawer and `/carrito` both need this: the cart lives in localStorage,
 * so there is nothing to resolve during SSR. `ready` stays false only for
 * that first join — later quantity changes keep the previous lines so the
 * empty state does not flash.
 */
export function useResolvedCart(): ResolvedCartView {
  const items = useCartStore((state) => state.items);
  const locale = useLocale() as Locale;
  const [resolved, setResolved] = useState<ResolvedCart>(EMPTY);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;

    let cancelled = false;

    void resolveCart(items, catalogRepository(), locale).then((next) => {
      if (!cancelled) {
        setResolved(next);
        setJoined(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [items, locale]);

  if (items.length === 0) {
    return { cart: EMPTY, ready: true };
  }

  return { cart: resolved, ready: joined };
}
