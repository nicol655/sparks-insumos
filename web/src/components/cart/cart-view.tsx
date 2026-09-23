"use client";

import { useTranslations } from "next-intl";

import { CartLineRow } from "@/components/cart/cart-line";
import { CartSummary } from "@/components/cart/cart-summary";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/lib/cart/store";
import { useResolvedCart } from "@/lib/cart/use-resolved-cart";

/**
 * T082 · client island: the cart is in localStorage, so the page shell is RSC
 * and this block hydrates the rows.
 */
export function CartView() {
  const t = useTranslations();
  const hydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);
  const remove = useCartStore((state) => state.remove);
  const { cart, ready } = useResolvedCart();

  if (!hydrated || (items.length > 0 && !ready)) {
    return <p className="text-body-m text-text-muted">{t("common.loading")}</p>;
  }

  if (cart.lines.length === 0 && cart.unavailable.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6 py-10">
        <p className="font-display text-[24px] italic">{t("cart.empty")}</p>
        <p className="text-body-m text-text-muted">{t("cart.emptyHint")}</p>
        <Link
          href="/catalogo"
          className="inline-flex min-h-11 items-center font-sans text-label tracking-[0.14em] uppercase underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {t("cart.browse")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[clamp(28px,4vw,54px)] lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="min-w-0">
        <div className="text-eyebrow text-text-meta mb-2 hidden grid-cols-[2.4fr_1fr_1fr_0.4fr] uppercase md:grid">
          <span>{t("cart.product")}</span>
          <span>{t("cart.quantity")}</span>
          <span className="text-right">{t("cart.price")}</span>
        </div>
        <ul>
          {cart.lines.map((line) => (
            <CartLineRow key={line.productId} line={line} layout="page" />
          ))}
        </ul>
        {cart.unavailable.map((item) => (
          <div
            key={item.productId}
            className="border-border-hairline flex items-center justify-between gap-4 border-b py-4"
          >
            <p className="text-body-s text-text-muted">{t("cart.unavailable")}</p>
            <button
              type="button"
              onClick={() => remove(item.productId)}
              className="inline-flex min-h-11 items-center font-sans text-label tracking-[0.14em] uppercase underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {t("cart.remove", { name: item.slug })}
            </button>
          </div>
        ))}
      </div>
      <CartSummary cart={cart} />
    </div>
  );
}
