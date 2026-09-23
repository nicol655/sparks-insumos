"use client";

import { useTranslations } from "next-intl";

import { BUTTON_TYPE, TOUCH_TARGET } from "@/components/primitives/button-base";
import { buildWhatsappUrl } from "@/lib/whatsapp";

/**
 * T065 · RF-1 / AC-10. Empty catalogue: a short explanation and a WhatsApp
 * door, so a dead-end filter never leaves the shopper without a next step.
 */
export function EmptyState() {
  const t = useTranslations();
  const href = buildWhatsappUrl({ message: t("whatsapp.catalogEmpty") });

  return (
    <div className="flex flex-col items-start gap-5 py-16">
      <h2 className="text-h3 font-display">{t("catalog.emptyTitle")}</h2>
      <p className="text-body-m text-text-muted max-w-prose">{t("catalog.emptyBody")}</p>
      <a
        href={href}
        className={[
          BUTTON_TYPE,
          TOUCH_TARGET,
          "inline-flex items-center justify-center bg-ink px-[30px] py-[17px] tracking-[0.2em] text-canvas",
          "hover:bg-accent-gold focus-visible:outline-ink",
        ].join(" ")}
      >
        {t("catalog.emptyCta")}
      </a>
    </div>
  );
}
