"use client";

import { useTranslations } from "next-intl";

import { GOLD_KICKER } from "@/components/primitives/gold-kicker";

const CELLS = ["shipping", "payments", "wholesale"] as const;

/**
 * 002 · three-cell strip between Club and the footer (envíos / pagos / mayorista).
 */
export function CommerceStrip() {
  const t = useTranslations("home.commerce");

  return (
    <section className="bg-border-hairline border-border-hairline grid gap-px border-b [grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))]">
      {CELLS.map((key) => (
        <article key={key} className="bg-canvas flex flex-col gap-2.5 px-8 py-8">
          <p className={GOLD_KICKER}>{t(`${key}Kicker`)}</p>
          <h2 className="font-display text-[26px] leading-[1.15]">{t(`${key}Title`)}</h2>
          <p className="text-body-m text-text-muted max-w-[36ch]">{t(`${key}Body`)}</p>
        </article>
      ))}
    </section>
  );
}
