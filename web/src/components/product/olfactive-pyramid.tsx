import { useTranslations } from "next-intl";

import type { Product } from "@/lib/api/contract";

type Props = {
  product: Product;
};

/**
 * T072 · RF-4. Top / heart / base. One column below 560px, three from `sm`.
 */
export function OlfactivePyramid({ product }: Props) {
  const t = useTranslations();
  const layers = [
    { id: "top", title: t("product.notesTop"), notes: product.notes.top },
    { id: "heart", title: t("product.notesHeart"), notes: product.notes.heart },
    { id: "base", title: t("product.notesBase"), notes: product.notes.base },
  ] as const;

  return (
    <section aria-labelledby="product-pyramid">
      <h2 id="product-pyramid" className="text-eyebrow text-text-meta mb-5 uppercase">
        {t("product.pyramid")}
      </h2>
      <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
        {layers.map((layer) => (
          <li key={layer.id}>
            <p className="font-mono text-mono-meta text-text-meta mb-2 tracking-[0.14em] uppercase">
              {layer.title}
            </p>
            <p className="text-body-s text-text-muted">{layer.notes.join(" · ")}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
