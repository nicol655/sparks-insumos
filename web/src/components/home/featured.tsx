"use client";

import { useTranslations } from "next-intl";

import { ProductCard } from "@/components/catalog/product-card";
import type { Product } from "@/lib/api/contract";

type Props = {
  products: Product[];
};

/** T053 · featured products. The card is the same one the catalogue uses. */
export function Featured({ products }: Props) {
  const t = useTranslations();

  if (products.length === 0) return null;

  return (
    <section className="px-gutter py-section">
      <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h2 className="text-h2 font-display">{t("home.featured.title")}</h2>
        <p className="text-body-m text-text-muted">{t("home.featured.note")}</p>
      </div>
      <ul className="grid gap-x-[26px] gap-y-[30px] [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    </section>
  );
}
