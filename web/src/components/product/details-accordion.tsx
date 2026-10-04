import { useTranslations } from "next-intl";

import { Accordion } from "@/components/primitives/accordion";

/**
 * T364 · the three panels start closed. Description is the packaging copy,
 * not a second printing of the text under the title.
 */
export function DetailsAccordion() {
  const t = useTranslations();

  return (
    <Accordion
      items={[
        {
          id: "description",
          title: t("product.description"),
          content: t("product.descriptionBody"),
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
