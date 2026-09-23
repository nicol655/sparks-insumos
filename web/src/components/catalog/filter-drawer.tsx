"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { XIcon } from "@/components/icons";
import type { CatalogQuery, Facets } from "@/lib/api/contract";
import type { UnavailableFacets } from "@/lib/catalog/query";
import { useFocusTrap, useScrollLock } from "@/lib/ui/overlay";
import { useUiStore } from "@/lib/ui/store";

type Props = {
  query: CatalogQuery;
  facets: Facets;
  unavailable: UnavailableFacets;
};

/**
 * T066 · below 900px the sidebar becomes a full-screen overlay. Same trap and
 * Escape behaviour as the mobile menu, on the shared `filters` overlay slot.
 */
export function FilterDrawer({ query, facets, unavailable }: Props) {
  const t = useTranslations();
  const overlay = useUiStore((state) => state.overlay);
  const close = useUiStore((state) => state.close);
  const open = overlay === "filters";
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, { active: open, onEscape: close });
  useScrollLock(open);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      id="catalog-filters"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-filters-title"
      className="bg-canvas fixed inset-0 z-[110] flex flex-col overflow-y-auto px-gutter py-6"
    >
      <div className="mb-8 flex items-center justify-between">
        <h2
          id="catalog-filters-title"
          className="font-sans text-label tracking-[0.14em] uppercase"
        >
          {t("catalog.filters")}
        </h2>
        <button
          type="button"
          aria-label={t("catalog.closeFilters")}
          onClick={close}
          className="flex h-11 w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <XIcon />
        </button>
      </div>
      <FilterSidebar query={query} facets={facets} unavailable={unavailable} />
    </div>
  );
}
