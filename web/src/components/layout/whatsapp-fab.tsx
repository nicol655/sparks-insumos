"use client";

import { useTranslations } from "next-intl";

import { WhatsappDot } from "@/components/icons";
import { useUiStore } from "@/lib/ui/store";
import { buildWhatsappUrl } from "@/lib/whatsapp";

/**
 * §03 / T045 · floating WhatsApp button.
 *
 * Fixed 26px from the bottom-right, z-index 80, ink with the 8px success
 * dot the document allows in place of the official logo. Hover inverts to
 * `#4CA455` with ink type. Hidden while any overlay is up so it cannot sit
 * on top of the menu, the search overlay or the cart drawer.
 */
export function WhatsappFab() {
  const t = useTranslations();
  const overlay = useUiStore((state) => state.overlay);

  if (overlay !== null) return null;

  return (
    <a
      href={buildWhatsappUrl({ message: t("whatsapp.general") })}
      aria-label={t("whatsapp.floatingLabel")}
      className={[
        "group fixed right-[26px] bottom-[26px] z-[80]",
        "inline-flex min-h-12 min-w-12 items-center gap-2 border border-canvas/20 bg-ink px-[16px] py-[12px] text-canvas",
        "font-sans text-label tracking-[0.14em] uppercase",
        "hover:bg-success hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
      ].join(" ")}
    >
      <WhatsappDot className="h-2 w-2 group-hover:bg-ink" />
      <span>{t("whatsapp.brand")}</span>
    </a>
  );
}
