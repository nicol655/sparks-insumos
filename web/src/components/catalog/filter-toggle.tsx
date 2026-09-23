"use client";

import { useTranslations } from "next-intl";

import { useUiStore } from "@/lib/ui/store";

/** Opens the filter overlay below 900px (T066). Hidden once the sidebar fits. */
export function FilterToggle() {
  const t = useTranslations();
  const overlay = useUiStore((state) => state.overlay);
  const toggle = useUiStore((state) => state.toggle);

  return (
    <button
      type="button"
      className={[
        "font-sans text-label tracking-[0.14em] uppercase lg:hidden",
        "min-h-12 border border-border-strong px-[18px]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
      ].join(" ")}
      aria-expanded={overlay === "filters"}
      aria-controls="catalog-filters"
      onClick={() => toggle("filters")}
    >
      {t("catalog.filters")}
    </button>
  );
}
