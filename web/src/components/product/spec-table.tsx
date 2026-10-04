import { useTranslations } from "next-intl";

import type { Product } from "@/lib/api/contract";

type Props = {
  product: Product;
};

/**
 * T364 · concentration and size only, and only when the product has them.
 * Longevity, sillage, occasion and SKU are not on the public GET.
 */
export function SpecTable({ product }: Props) {
  const t = useTranslations();
  const rows = [
    { term: t("product.concentration"), value: product.concentration },
    { term: t("product.size"), value: product.size?.label ?? "" },
  ].filter((row) => row.value.trim().length > 0);

  if (rows.length === 0) return null;

  return (
    <dl className="border-border-hairline bg-border-hairline grid grid-cols-1 gap-px border sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.term} className="bg-canvas flex flex-col gap-1 px-[18px] py-[15px]">
          <dt className="font-mono text-[10px] tracking-[0.14em] text-text-meta uppercase">
            {row.term}
          </dt>
          <dd className="text-[14px]">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
