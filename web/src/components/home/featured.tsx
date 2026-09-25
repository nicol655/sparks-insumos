"use client";

import { useTranslations } from "next-intl";

import { ProductCard } from "@/components/catalog/product-card";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/api/contract";

type Props = {
  products: Product[];
};

/** T053 / 006 · featured products. Title and “view all” match the prototype. */
export function Featured({ products }: Props) {
  const t = useTranslations();

  if (products.length === 0) return null;

  return (
    <section className="px-gutter py-section">
      <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h2 className="text-h2 font-display">{t("home.featured.title")}</h2>
        <Link
          href="/catalogo"
          className="inline-flex min-h-11 items-center font-sans text-[11px] tracking-[0.08em] uppercase underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {t("home.featured.viewAll")}
        </Link>
      </div>
      <ul className="grid gap-x-[26px] gap-y-[30px] [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    </section>
  );
}
