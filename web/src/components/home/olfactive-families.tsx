"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { FacetValue } from "@/lib/api/contract";
import { FAMILY_MESSAGE, isFamilySlug } from "@/lib/catalog/families";

type FamilySlug = keyof typeof FAMILY_MESSAGE;

type Props = {
  families: FacetValue[];
};

/**
 * T052 · olfactive families. Auto-fit grid, 1px dividers via gap on a
 * hairline background, index in accent-gold (large enough to pass RNF-2).
 * Each tile lands on the catalogue already filtered (T062).
 */
export function OlfactiveFamilies({ families }: Props) {
  const t = useTranslations();
  const known = families.filter((family): family is FacetValue & { value: FamilySlug } =>
    isFamilySlug(family.value),
  );

  return (
    <section className="px-gutter py-section">
      <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h2 className="text-h2 font-display">{t("home.families.title")}</h2>
        <p className="text-body-m text-text-muted max-w-[44ch]">{t("home.families.note")}</p>
      </div>
      <ul className="bg-border-hairline grid gap-px [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))]">
        {known.map((family, index) => (
          <li key={family.value} className="bg-canvas">
            <Link
              href={{ pathname: "/catalogo", query: { family: family.value } }}
              className="flex min-h-[180px] flex-col justify-between p-7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span className="font-mono text-[24px] leading-none text-accent-gold tracking-[0.14em]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-h3 font-display">{t(FAMILY_MESSAGE[family.value])}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
