"use client";

import { useTranslations } from "next-intl";

/**
 * First focusable control on every page. Sends keyboard users past the
 * announcement bar and the header, which otherwise sit in the way of the
 * content they came for.
 */
export function SkipLink() {
  const t = useTranslations("common");

  return (
    <a
      href="#contenido"
      className={[
        "sr-only focus:not-sr-only",
        "focus:absolute focus:top-2 focus:left-2 focus:z-[70]",
        "focus:bg-ink focus:px-4 focus:py-3 focus:text-canvas",
        "font-sans text-label tracking-[0.14em] uppercase",
      ].join(" ")}
    >
      {t("skipToContent")}
    </a>
  );
}
