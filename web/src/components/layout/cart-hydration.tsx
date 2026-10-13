"use client";

import { useEffect } from "react";

import { usePathname } from "@/i18n/navigation";
import { readSignedInFromDocument } from "@/lib/auth/session";
import { loadSessionCart } from "@/lib/cart/browser";
import { hydrateCartSession } from "@/lib/cart/hydrate-session";

/**
 * Loads the cart after paint, after client navigations, and when the tab
 * becomes visible again.
 *
 * The locale layout keeps this mounted across login and while the shopper
 * uses another browser/tab. Pathname + visibility re-runs ensure `/api/me`
 * runs after sign-in and picks up cart changes made elsewhere (021 AC-8/9).
 */
export function CartHydration() {
  const pathname = usePathname();

  useEffect(() => {
    void hydrateCartSession(loadSessionCart);
  }, [pathname]);

  useEffect(() => {
    function refreshIfSignedIn() {
      if (document.visibilityState !== "visible") return;
      if (!readSignedInFromDocument()) return;
      void hydrateCartSession(loadSessionCart);
    }

    document.addEventListener("visibilitychange", refreshIfSignedIn);
    window.addEventListener("focus", refreshIfSignedIn);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfSignedIn);
      window.removeEventListener("focus", refreshIfSignedIn);
    };
  }, []);

  return null;
}
