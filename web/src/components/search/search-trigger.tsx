"use client";

import { useTranslations } from "next-intl";

import { SearchIcon } from "@/components/icons";
import { useUiStore } from "@/lib/ui/store";

/**
 * T090 · header search. Desktop is the word with a 1px underline; below 900px
 * it collapses to the 13px glyph. Owns `id` / `aria-controls` so the overlay
 * can restore focus here (AC-12).
 */

const LABEL =
  "font-sans text-label tracking-[0.14em] uppercase text-ink transition-colors " +
  "hover:text-ink/70 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function SearchTrigger() {
  const t = useTranslations();
  const overlay = useUiStore((state) => state.overlay);
  const open = useUiStore((state) => state.open);

  return (
    <button
      type="button"
      id="header-search"
      aria-expanded={overlay === "search"}
      aria-controls="search-overlay"
      aria-label={t("header.search")}
      onClick={() => open("search")}
      className={[
        "flex h-11 min-w-11 items-center justify-center",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        "lg:h-auto lg:border-b lg:border-ink/25 lg:pb-px lg:hover:border-ink",
      ].join(" ")}
    >
      <SearchIcon className="h-[13px] w-[13px] lg:hidden" />
      <span className={`${LABEL} hidden lg:inline`}>{t("header.search")}</span>
    </button>
  );
}
