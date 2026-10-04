import { useTranslations } from "next-intl";

import { GOLD_INDEX } from "@/components/primitives/gold-kicker";
import type { Product } from "@/lib/api/contract";

type Props = {
  product: Product;
};

/**
 * T364 · three hairline cells. Hidden when the product has no notes,
 * which is every row the public GET returns today.
 */
export function OlfactivePyramid({ product }: Props) {
  const t = useTranslations();
  const layers = [
    { id: "top", title: t("product.notesTop"), notes: product.notes.top },
    { id: "heart", title: t("product.notesHeart"), notes: product.notes.heart },
    { id: "base", title: t("product.notesBase"), notes: product.notes.base },
  ] as const;

  if (layers.every((layer) => layer.notes.length === 0)) return null;

  return (
    <section aria-labelledby="product-pyramid">
      <h2
        id="product-pyramid"
        className="font-mono text-[10px] tracking-[0.2em] text-text-meta uppercase"
      >
        {t("product.pyramid")}
      </h2>
      <ol className="border-border-hairline bg-border-hairline mt-[14px] grid grid-cols-1 gap-px border sm:grid-cols-3">
        {layers.map((layer) => (
          <li key={layer.id} className="bg-canvas flex flex-col gap-2 px-[18px] py-5">
            <p className={GOLD_INDEX}>{layer.title}</p>
            <p className="font-display text-[19px] leading-[1.3]">{layer.notes.join(" · ")}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
