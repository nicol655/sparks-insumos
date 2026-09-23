"use client";

import { useTranslations } from "next-intl";

/**
 * T054 · three service tiles. Dividers are a 1px hairline gap, same trick as
 * the family grid. Copy is the operational promise already used in the
 * announcement bar and the product accordion, not a new offer.
 */
export function Services() {
  const t = useTranslations("home.services");
  const items = [
    { title: t("shippingTitle"), body: t("shippingBody") },
    { title: t("adviceTitle"), body: t("adviceBody") },
    { title: t("returnsTitle"), body: t("returnsBody") },
  ];

  return (
    <section className="px-gutter py-section">
      <ul className="bg-border-hairline grid gap-px [grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))]">
        {items.map((item) => (
          <li key={item.title} className="bg-canvas flex flex-col gap-3 p-8">
            <h2 className="text-h5 font-display">{item.title}</h2>
            <p className="text-body-m text-text-muted max-w-[36ch]">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
