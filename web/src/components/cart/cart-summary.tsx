"use client";

import { useLocale, useTranslations } from "next-intl";

import { BUTTON_TYPE, TOUCH_TARGET } from "@/components/primitives/button-base";
import { Link } from "@/i18n/navigation";
import type { ResolvedCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format/price";
import { useUiStore } from "@/lib/ui/store";
import { buildOrderMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import type { Locale } from "@/i18n/locales";

type Props = {
  cart: ResolvedCart;
  /** Drawer gets a link to the full cart page; the page does not. */
  showCartLink?: boolean;
};

/**
 * T082 / T084. Subtotal and the WhatsApp order CTA. Coupon is T083, blocked.
 */
export function CartSummary({ cart, showCartLink = false }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const close = useUiStore((state) => state.close);
  const empty = cart.lines.length === 0;
  const href = empty
    ? undefined
    : buildWhatsappUrl({
        message: buildOrderMessage(
          t("whatsapp.orderIntro"),
          cart.lines.map((line) =>
            t("whatsapp.orderLine", {
              quantity: line.quantity,
              brand: line.product.brand,
              name: line.product.name,
              size: line.product.size.label,
              price: formatPrice(line.lineTotal, locale),
            }),
          ),
          t("whatsapp.orderTotal", { total: formatPrice(cart.subtotal, locale) }),
        ),
      });

  return (
    <aside className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <p className="font-sans text-label tracking-[0.14em] uppercase">{t("cart.subtotal")}</p>
        <p className="font-display text-price">{formatPrice(cart.subtotal, locale)}</p>
      </div>
      {showCartLink ? (
        <Link
          href="/carrito"
          onClick={close}
          className={[
            BUTTON_TYPE,
            TOUCH_TARGET,
            "inline-flex items-center justify-center border border-ink px-[30px] py-[17px] tracking-[0.2em]",
            "hover:bg-ink hover:text-canvas focus-visible:outline-ink",
          ].join(" ")}
        >
          {t("cart.viewCart")}
        </Link>
      ) : null}
      {href ? (
        <a
          href={href}
          className={[
            BUTTON_TYPE,
            TOUCH_TARGET,
            "inline-flex items-center justify-center bg-ink px-[30px] py-[17px] tracking-[0.2em] text-canvas",
            "hover:bg-accent-gold focus-visible:outline-ink",
          ].join(" ")}
        >
          {t("cart.checkout")}
        </a>
      ) : null}
    </aside>
  );
}
