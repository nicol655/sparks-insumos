"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { XIcon } from "@/components/icons";
import { LiveResults } from "@/components/search/live-results";
import type { Locale } from "@/i18n/locales";
import { catalogQuerySchema } from "@/lib/api";
import { catalogUrl } from "@/lib/catalog/search-params";
import { useFocusTrap, useScrollLock } from "@/lib/ui/overlay";
import { useUiStore } from "@/lib/ui/store";

/**
 * T091 · AC-12. Full-viewport backdrop, top panel with fadeUp 280ms.
 * The input is the first focusable so the shared trap lands on it; Escape
 * restores the header trigger. Enter submits to `/catalogo?q=`.
 */
export function SearchOverlay() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const overlay = useUiStore((state) => state.overlay);
  const closeOverlay = useUiStore((state) => state.close);
  const open = overlay === "search";
  const panelRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState("");

  const close = useCallback(() => {
    setTerm("");
    closeOverlay();
  }, [closeOverlay]);

  useFocusTrap(panelRef, { active: open, onEscape: close });
  useScrollLock(open);

  if (!open) return null;

  function goToCatalog() {
    const query = catalogQuerySchema.parse({ q: term.trim() || undefined });
    close();
    window.location.assign(catalogUrl(query, locale));
  }

  return (
    <div className="fixed inset-0 z-[101]">
      <div
        aria-hidden="true"
        onClick={close}
        className="absolute inset-0 bg-[rgb(20_16_14/0.55)] backdrop-blur-[3px]"
      />
      <div
        ref={panelRef}
        id="search-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-overlay-title"
        className="animate-fade-up bg-canvas absolute inset-x-0 top-0 px-gutter pt-8 pb-10"
      >
        <div className="relative">
          <h2 id="search-overlay-title" className="sr-only">
            {t("search.title")}
          </h2>
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              goToCatalog();
            }}
          >
            <label htmlFor="search-overlay-input" className="sr-only">
              {t("search.title")}
            </label>
            <input
              id="search-overlay-input"
              type="search"
              name="q"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t("search.placeholder")}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={[
                "font-display w-full bg-transparent py-3 pr-14 text-[40px] leading-none text-ink",
                "border-b border-ink placeholder:text-text-meta",
                "focus:shadow-[0_1px_0_var(--color-ink)] focus:outline-none",
              ].join(" ")}
            />
          </form>
          <button
            type="button"
            aria-label={t("search.close")}
            onClick={close}
            className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <XIcon />
          </button>
        </div>
        <LiveResults term={term} onSuggest={setTerm} />
      </div>
    </div>
  );
}
