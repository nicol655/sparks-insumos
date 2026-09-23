"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { BUTTON_TYPE, TOUCH_TARGET } from "@/components/primitives/button-base";
import { ButtonPrimary } from "@/components/primitives/button-primary";
import { QuantityStepper } from "@/components/primitives/quantity-stepper";
import { StockBadge } from "@/components/primitives/badge";
import type { Product } from "@/lib/api/contract";
import { useAddToCart } from "@/lib/cart/use-add-to-cart";
import { formatPrice } from "@/lib/format/price";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import type { Locale } from "@/i18n/locales";

type Props = {
  product: Product;
};

/**
 * T073 · RF-4. Price, stock, stepper and the primary add action. Sold out
 * drops the stepper and offers WhatsApp instead (RF-9).
 */
export function PurchaseBlock({ product }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const addToCart = useAddToCart();
  const soldOut = product.stock <= 0;
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-6">
      <p className="font-display text-price">{formatPrice(product.price.amount, locale)}</p>
      <StockBadge inStock={!soldOut}>
        {soldOut ? t("common.outOfStock") : t("product.inStock")}
      </StockBadge>
      {soldOut ? (
        <a
          href={buildWhatsappUrl({
            message: t("whatsapp.stock", {
              brand: product.brand,
              name: product.name,
              size: product.size.label,
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
        <div className="flex flex-wrap items-center gap-4">
          <QuantityStepper
            value={quantity}
            max={product.stock}
            onChange={setQuantity}
            decreaseLabel={t("product.decrease")}
            increaseLabel={t("product.increase")}
            valueLabel={t("product.quantity")}
          />
          <ButtonPrimary
            onClick={() => addToCart(product, quantity)}
          >
            {t("product.addToCart")}
          </ButtonPrimary>
        </div>
      )}
    </div>
  );
}
