import { useTranslations } from "next-intl";

import { Accordion } from "@/components/primitives/accordion";
import type { Product } from "@/lib/api/contract";

type Props = {
  product: Product;
};

/**
 * T074 · RF-4. Description / shipping / returns, several panels at once,
 * body capped at 56ch by the primitive.
 */
export function DetailsAccordion({ product }: Props) {
  const t = useTranslations();

  return (
    <Accordion
      defaultOpen={["description"]}
      items={[
        {
          id: "description",
          title: t("product.description"),
          content: product.description,
        },
        {
          id: "shipping",
          title: t("product.shipping"),
          content: t("product.shippingBody"),
        },
        {
          id: "returns",
          title: t("product.returns"),
          content: t("product.returnsBody"),
        },
      ]}
    />
  );
}
