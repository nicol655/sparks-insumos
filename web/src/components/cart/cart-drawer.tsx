"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

import { CartLineRow } from "@/components/cart/cart-line";
import { CartSummary } from "@/components/cart/cart-summary";
import { XIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/lib/cart/store";
import { useResolvedCart } from "@/lib/cart/use-resolved-cart";
import { useFocusTrap, useScrollLock } from "@/lib/ui/overlay";
import { useUiStore } from "@/lib/ui/store";

/**
 * T080 · AC-11. Right panel 420px (max 92vw), z-101, slideIn 300ms,
 * backdrop rgba(20,16,14,0.5). Focus trapped; Escape restores the trigger.
 */
export function CartDrawer() {
  const t = useTranslations();
  const overlay = useUiStore((state) => state.overlay);
  const close = useUiStore((state) => state.close);
  const items = useCartStore((state) => state.items);
  const open = overlay === "cart";
  const panelRef = useRef<HTMLDivElement>(null);
  const { cart, ready } = useResolvedCart();

  useFocusTrap(panelRef, { active: open, onEscape: close });
  useScrollLock(open);

  if (!open) return null;

  const resolving = items.length > 0 && !ready;
  const empty = !resolving && cart.lines.length === 0;

  return (
    <div className="fixed inset-0 z-[101]">
      <div
        aria-hidden="true"
        onClick={close}
        className="absolute inset-0 bg-[rgb(20_16_14/0.5)]"
      />
      <div
        ref={panelRef}
        id="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="animate-slide-in bg-canvas absolute top-0 right-0 flex h-full w-[min(420px,92vw)] flex-col"
      >
        <div className="flex items-center justify-between px-6 py-5">
          <h2
            id="cart-drawer-title"
            className="font-sans text-label tracking-[0.14em] uppercase"
          >
            {t("cart.title")}
          </h2>
          <button
            type="button"
            aria-label={t("cart.close")}
            onClick={close}
            className="flex h-11 w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <XIcon />
          </button>
        </div>

        {resolving ? (
          <p className="text-body-m text-text-muted px-6 py-10">{t("common.loading")}</p>
        ) : empty ? (
          <div className="flex flex-1 flex-col gap-6 px-6 py-10">
            <p className="font-display text-[24px] italic">{t("cart.empty")}</p>
            <Link
              href="/catalogo"
              onClick={close}
              className="inline-flex min-h-11 items-center font-sans text-label tracking-[0.14em] uppercase underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {t("cart.browse")}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6">{cart.lines.map((line) => (
              <CartLineRow key={line.productId} line={line} layout="drawer" />
            ))}</ul>
            <div className="border-border-hairline border-t px-6 py-6">
              <CartSummary cart={cart} showCartLink />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
