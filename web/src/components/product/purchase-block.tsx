"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { WhatsappDot } from "@/components/icons";
import { StockBadge } from "@/components/primitives/badge";
import { BUTTON_TYPE, TOUCH_TARGET } from "@/components/primitives/button-base";
import { ButtonPrimary } from "@/components/primitives/button-primary";
import { QuantityStepper } from "@/components/primitives/quantity-stepper";
import type { Locale } from "@/i18n/locales";
import type { Product } from "@/lib/api/contract";
import { useAddToCart } from "@/lib/cart/use-add-to-cart";
import { formatPrice } from "@/lib/format/price";
import { buildWhatsappUrl } from "@/lib/whatsapp";

type Props = {
  product: Product;
};

/**
 * T362 · price row from the artifact. Stock is omitted when the API does not
 * send a number. Sold out keeps the single stock WhatsApp.
 */
export function PurchaseBlock({ product }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const addToCart = useAddToCart();
  const soldOut = product.stock === 0;
  const stockKnown = product.stock !== null;
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-border-hairline flex items-baseline gap-4 border-y py-[18px]">
        <p className="font-display text-[clamp(28px,3vw,40px)]">
          {formatPrice(product.price.amount, locale)}
        </p>
        <p className="text-text-meta text-[12px] font-light">{t("product.installments")}</p>
        {stockKnown ? (
          <span className="ml-auto">
            <StockBadge inStock={!soldOut}>
              {soldOut ? t("common.outOfStock") : t("product.inStock")}
            </StockBadge>
          </span>
        ) : null}
      </div>
      {soldOut ? (
        <a
          href={buildWhatsappUrl({
            message: t("whatsapp.stock", {
              brand: product.brand,
              name: product.name,
              size: product.size?.label ?? "",
            }),
          })}
          className={[
            BUTTON_TYPE,
            TOUCH_TARGET,
            "inline-flex items-center justify-center self-start bg-ink px-[30px] py-[17px] tracking-[0.2em] text-canvas",
            "hover:bg-accent-gold focus-visible:outline-ink",
          ].join(" ")}
        >
          {t("product.askStock")}
        </a>
      ) : (
        <>
          <div className="flex items-stretch gap-[14px]">
            <QuantityStepper
              value={quantity}
              max={product.stock}
              onChange={setQuantity}
              decreaseLabel={t("product.decrease")}
              increaseLabel={t("product.increase")}
              valueLabel={t("product.quantity")}
            />
            <div className="flex-1 [&>button]:w-full">
              <ButtonPrimary onClick={() => addToCart(product, quantity)}>
                {t("product.addToCart")}
              </ButtonPrimary>
            </div>
          </div>
          <a
            href={buildWhatsappUrl({
              message: t("whatsapp.thisPerfume", { name: product.name }),
            })}
            className={[
              "border-border-strong inline-flex min-h-11 items-center justify-center gap-[10px] border px-[15px] py-[15px]",
              "text-[11px] tracking-[0.18em] uppercase",
              "hover:border-ink hover:bg-ink/4",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
            ].join(" ")}
          >
            <WhatsappDot />
            {t("product.askThis")}
          </a>
        </>
      )}
    </div>
  );
}
