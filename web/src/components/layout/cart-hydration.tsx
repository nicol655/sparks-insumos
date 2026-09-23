"use client";

import { useEffect } from "react";

import { rehydrateCart } from "@/lib/cart/store";

/**
 * Reads the persisted cart back after the first paint.
 *
 * The store sets `skipHydration` on purpose: the server renders an empty badge,
 * so hydrating during render would make React's first client render disagree
 * with the HTML. Doing it in an effect costs one extra frame with the counter
 * at zero and buys a mismatch-free hydration (see .ai/lessons.md).
 *
 * Renders nothing; it is mounted once in the locale layout.
 */
export function CartHydration() {
  useEffect(() => {
    void rehydrateCart();
  }, []);

  return null;
}
