import { useTranslations } from "next-intl";

import { ProductGrid } from "@/components/catalog/product-grid";
import type { Product } from "@/lib/api/contract";

type Props = {
  products: Product[];
};

/**
 * T075 · same cards as the catalogue. Hidden when the repository returns none.
 */
export function Related({ products }: Props) {
  const t = useTranslations();

  if (products.length === 0) return null;

  return (
    <section className="px-gutter py-section">
      <h2 className="text-h2 font-display mb-8">{t("product.related")}</h2>
      <ProductGrid products={products} label={t("product.relatedList")} />
    </section>
  );
}
