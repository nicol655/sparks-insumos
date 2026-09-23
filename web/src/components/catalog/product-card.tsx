"use client";

import { useLocale, useTranslations } from "next-intl";

import { Packshot } from "@/components/catalog/packshot";
import { Badge } from "@/components/primitives/badge";
import { ButtonTertiary } from "@/components/primitives/button-tertiary";
import { SkeletonCard } from "@/components/primitives/skeleton";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/api/contract";
import { useAddToCart } from "@/lib/cart/use-add-to-cart";
import { formatPrice } from "@/lib/format/price";

/**
 * §03 · catalogue card. Image 3/3.7, brand+size in mono, name in Cormorant,
 * notes, price + tertiary button. Hover turns the image border ink — no gold
 * on the name (under 24px, RNF-2), no scale, no shadow.
 */

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const addToCart = useAddToCart();
  const soldOut = product.stock <= 0;
  const notes = [...product.notes.top, ...product.notes.heart].slice(0, 3).join(" · ");

  return (
    <li className="group flex flex-col gap-[13px]">
      <Link
        href={{ pathname: "/catalogo/[slug]", params: { slug: product.slug } }}
        aria-label={t("catalog.viewProduct", { name: product.name })}
        className="flex flex-col gap-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <div className="relative">
          <div className="border-border-hairline overflow-hidden border transition-colors group-hover:border-ink">
            <Packshot alt={product.images.alt} src={product.images.packshot} />
          </div>
          {product.badge ? (
            <span className="absolute top-[10px] left-[10px]">
              <Badge>{product.badge}</Badge>
            </span>
          ) : null}
          {soldOut ? (
            <span className="absolute top-[10px] right-[10px]">
              <Badge tone="muted">{t("common.outOfStock")}</Badge>
            </span>
          ) : null}
        </div>
        <p className="font-mono text-mono-meta text-text-meta tracking-[0.12em] uppercase">
          {product.brand} · {product.size.label}
        </p>
        <h3 className="font-display text-h4 transition-colors">
          {product.name}
        </h3>
        <p className="text-body-s text-text-muted">{notes}</p>
      </Link>
      <div className="mt-auto flex items-end justify-between gap-3">
        <p className="font-display text-h4">{formatPrice(product.price.amount, locale)}</p>
        <ButtonTertiary
          disabled={soldOut}
          onClick={() => addToCart(product)}
        >
          {t("catalog.add")}
        </ButtonTertiary>
      </div>
    </li>
  );
}

export function ProductCardSkeleton({ label }: { label: string }) {
  return (
    <li>
      <SkeletonCard label={label} />
    </li>
  );
}
