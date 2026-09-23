"use client";

import { useLocale, useTranslations } from "next-intl";

import { Packshot } from "@/components/catalog/packshot";
import { XIcon } from "@/components/icons";
import { QuantityStepper } from "@/components/primitives/quantity-stepper";
import { Link } from "@/i18n/navigation";
import type { CartLine } from "@/lib/cart/store";
import { useCartStore } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format/price";
import type { Locale } from "@/i18n/locales";

type Props = {
  line: CartLine;
  layout: "drawer" | "page";
};

/**
 * T082 · one bottle in the cart. Drawer is compact; the page uses the
 * 2.4fr / 1fr / 1fr / 0.4fr row (stacked below 700px). Removal is the ✕,
 * never a zero on the stepper (RF-5).
 */
export function CartLineRow({ line, layout }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const price = formatPrice(line.lineTotal, locale);

  const stepper = (
    <QuantityStepper
      value={line.quantity}
      max={line.product.stock}
      onChange={(quantity) => setQuantity(line.productId, quantity)}
      decreaseLabel={t("cart.decrease")}
      increaseLabel={t("cart.increase")}
      valueLabel={t("cart.quantity")}
    />
  );

  const removeButton = (
    <button
      type="button"
      aria-label={t("cart.remove", { name: line.product.name })}
      onClick={() => remove(line.productId)}
      className="flex h-11 w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <XIcon />
    </button>
  );

  const pack =
    layout === "page"
      ? { width: "w-[74px]", ratio: "3 / 3.6", intrinsicWidth: 148 }
      : { width: "w-[72px]", ratio: "1 / 1", intrinsicWidth: 144 };

  const identity = (
    <div className={`flex min-w-0 items-center ${layout === "page" ? "gap-[18px]" : "gap-4"}`}>
      <div className={`${pack.width} shrink-0`}>
        <Packshot
          alt={line.product.images.alt}
          src={line.product.images.packshot}
          ratio={pack.ratio}
          intrinsicWidth={pack.intrinsicWidth}
        />
      </div>
      <div className={layout === "page" ? "flex min-w-0 flex-col gap-[5px]" : "min-w-0"}>
        <p
          className={
            layout === "page"
              ? "font-mono text-[9.5px] tracking-[0.14em] text-text-meta uppercase"
              : "font-mono text-mono-meta text-text-meta tracking-[0.12em] uppercase"
          }
        >
          {line.product.brand} · {line.product.size.label}
        </p>
        <Link
          href={{ pathname: "/catalogo/[slug]", params: { slug: line.slug } }}
          className={
            layout === "page"
              ? "font-display text-[20px] leading-[1.15] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              : "font-display text-h4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          }
        >
          {line.product.name}
        </Link>
        {layout === "page" ? (
          <p className="text-text-meta text-[12.5px]">
            {formatPrice(line.unitPrice, locale)} {t("cart.each")}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (layout === "drawer") {
    return (
      <li className="border-border-hairline flex flex-col gap-3 border-b py-5">
        <div className="flex items-start justify-between gap-3">
          {identity}
          {removeButton}
        </div>
        <div className="flex items-center justify-between gap-3">
          {stepper}
          <p className="font-display text-h4">{price}</p>
        </div>
      </li>
    );
  }

  return (
    <li className="border-border-hairline grid grid-cols-1 items-center gap-3 border-b py-[22px] md:grid-cols-[2.4fr_1fr_1fr_0.4fr]">
      {identity}
      <div className="mt-1 flex items-center justify-between gap-3 md:mt-0 md:contents">
        <div className="md:justify-self-center">{stepper}</div>
        <p className="text-[16px] md:text-right">{price}</p>
        <div className="md:justify-self-end">{removeButton}</div>
      </div>
    </li>
  );
}
