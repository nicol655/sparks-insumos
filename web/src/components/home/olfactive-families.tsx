"use client";

import { useTranslations } from "next-intl";

import { GOLD_INDEX } from "@/components/primitives/gold-kicker";
import { Link } from "@/i18n/navigation";
import type { FacetValue } from "@/lib/api/contract";
import { FAMILY_MESSAGE, isFamilySlug } from "@/lib/catalog/families";

type FamilySlug = keyof typeof FAMILY_MESSAGE;

type Props = {
  families: FacetValue[];
};

/**
 * T052 / 006 · olfactive families. Proto tiles: index, name, desc, count,
 * min-h 250, hover inverts to ink. Index is the proto 10px gold kicker;
 * on hover it switches to canvas.
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
        <p className="font-mono text-text-meta max-w-[44ch] text-[10px] tracking-[0.16em] uppercase">
          {t("home.families.note")}
        </p>
      </div>
      <ul className="bg-border-hairline grid gap-px [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))]">
        {known.map((family, index) => (
          <li key={family.value} className="bg-canvas">
            <Link
              href={{ pathname: "/catalogo", query: { family: family.value } }}
              className="group hover:bg-ink hover:text-canvas flex min-h-[250px] flex-col justify-between px-[26px] pt-[34px] pb-[28px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span className={`${GOLD_INDEX} group-hover:text-canvas`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex flex-col gap-2">
                <span className="text-h3 font-display">{t(FAMILY_MESSAGE[family.value])}</span>
                <span className="text-text-muted group-hover:text-canvas/70 text-[13px] font-light">
                  {t(`home.families.desc.${family.value}`)}
                </span>
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase">
                  {t("catalog.count", { count: family.count })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
