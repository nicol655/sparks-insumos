import { useTranslations } from "next-intl";

import type { Product } from "@/lib/api/contract";
import { FAMILY_MESSAGE, isFamilySlug } from "@/lib/catalog/families";

type Props = {
  product: Product;
};

/**
 * T072 · family, concentration, size. Stacks to one column below 560px.
 */
export function SpecTable({ product }: Props) {
  const t = useTranslations();
  const family = isFamilySlug(product.family)
    ? t(FAMILY_MESSAGE[product.family])
    : product.family;

  const rows = [
    { term: t("product.family"), value: family },
    { term: t("product.concentration"), value: product.concentration },
    { term: t("product.size"), value: product.size.label },
  ];

  return (
    <section aria-labelledby="product-specs">
      <h2 id="product-specs" className="text-eyebrow text-text-meta mb-5 uppercase">
        {t("product.specs")}
      </h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.term}>
            <dt className="font-mono text-mono-meta text-text-meta tracking-[0.12em] uppercase">
              {row.term}
            </dt>
            <dd className="text-body-s mt-1">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
