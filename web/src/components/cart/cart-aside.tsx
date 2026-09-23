"use client";

import type { FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

import { BoxedInput } from "@/components/primitives/boxed-input";
import { BUTTON_TYPE, TOUCH_TARGET } from "@/components/primitives/button-base";
import { ButtonPrimary } from "@/components/primitives/button-primary";
import type { ResolvedCart } from "@/lib/cart/store";
import { meetsCartMinimum } from "@/lib/cart/min-order";
import { formatPrice } from "@/lib/format/price";
import { buildOrderMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import type { Locale } from "@/i18n/locales";

type Props = {
  cart: ResolvedCart;
};

/**
 * 005 · page-only summary. The drawer keeps CartSummary so T080 does not
 * inherit this 380px box. Coupon submit is a no-op until T083.
 */
export function CartAside({ cart }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const subtotal = formatPrice(cart.subtotal, locale);
  const canCheckout = meetsCartMinimum(cart.subtotal);
  const href = canCheckout
    ? buildWhatsappUrl({
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
          t("whatsapp.orderTotal", { total: subtotal }),
        ),
      })
    : undefined;

  function handleCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <aside className="border-border-hairline bg-surface-raised flex flex-col gap-[18px] border p-[30px]">
      <p className="text-text-meta font-mono text-[10px] tracking-[0.2em] uppercase">
        {t("cart.summary")}
      </p>

      <div className="flex flex-col gap-[11px] text-[13.5px] font-light">
        <div className="flex justify-between gap-4">
          <span>{t("cart.subtotal")}</span>
          <span>{subtotal}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>{t("cart.shipping")}</span>
          <span>{t("cart.shippingQuote")}</span>
        </div>
      </div>

      <form className="border-border-hairline flex items-end gap-2 border-t pt-4" onSubmit={handleCoupon}>
        <div className="min-w-0 flex-1">
          <BoxedInput name="coupon" label={t("cart.couponPh")} placeholder={t("cart.couponPh")} autoComplete="off" />
        </div>
        <ButtonPrimary type="submit" compact>
          {t("cart.apply")}
        </ButtonPrimary>
      </form>

      <div className="flex items-baseline justify-between gap-4 border-t border-ink pt-4">
        <span className="text-[11px] tracking-[0.16em] uppercase">{t("cart.total")}</span>
        <span className="font-display text-[34px] leading-none">{subtotal}</span>
      </div>

      {href ? (
        <a
          href={href}
          className={[
            BUTTON_TYPE,
            TOUCH_TARGET,
            "inline-flex w-full items-center justify-center bg-ink px-[30px] py-[17px] tracking-[0.2em] text-canvas",
            "hover:bg-accent-gold focus-visible:outline-ink",
          ].join(" ")}
        >
          {t("cart.placeOrder")}
        </a>
      ) : (
        <button
          type="button"
          disabled
          className={[
            BUTTON_TYPE,
            TOUCH_TARGET,
            "inline-flex w-full items-center justify-center bg-ink/35 px-[30px] py-[17px] tracking-[0.2em] text-canvas/70",
          ].join(" ")}
        >
          {t("cart.placeOrder")}
        </button>
      )}

      <p className="text-text-muted text-[11.5px] leading-[1.6] font-light">{t("cart.note")}</p>
    </aside>
  );
}
