"use client";

import { useTranslations } from "next-intl";

import { CartAside } from "@/components/cart/cart-aside";
import { CartLineRow } from "@/components/cart/cart-line";
import { BUTTON_TYPE, TOUCH_TARGET } from "@/components/primitives/button-base";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/lib/cart/store";
import { useResolvedCart } from "@/lib/cart/use-resolved-cart";

/**
 * T082 / 005 · client island: the cart is in localStorage, so the page shell
 * is RSC and this block hydrates the rows.
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
      <div className="border-border-hairline flex flex-col items-center gap-[18px] px-gutter py-16 text-center md:p-[70px]">
        <p className="font-display text-text-meta text-[28px] italic">{t("cart.emptyPage")}</p>
        <Link
          href="/catalogo"
          className={[
            BUTTON_TYPE,
            TOUCH_TARGET,
            "inline-flex items-center justify-center bg-ink px-[28px] py-[15px] tracking-[0.2em] text-canvas",
            "hover:bg-accent-gold focus-visible:outline-ink",
          ].join(" ")}
        >
          {t("cart.browse")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[clamp(28px,3.2vw,54px)] lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="min-w-0">
        <div className="text-text-meta mb-3 hidden grid-cols-[2.4fr_1fr_1fr_0.4fr] border-b border-ink pb-3 font-mono text-[9.5px] tracking-[0.16em] uppercase lg:grid">
          <span>{t("cart.product")}</span>
          <span className="text-center">{t("cart.quantity")}</span>
          <span className="text-right">{t("cart.price")}</span>
          <span />
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
      <CartAside cart={cart} />
    </div>
  );
}
