"use client";

import { useLocale } from "next-intl";
import type { ReactNode } from "react";

import { XIcon } from "@/components/icons";
import type { Locale } from "@/i18n/locales";
import type { CatalogQuery } from "@/lib/api/contract";
import { catalogUrl } from "@/lib/catalog/search-params";

/**
 * Toggle chips that work without client JS: each state is a real `/catalogo`
 * URL. Native `<a>` (not next-intl `Link`) so a hydrated client still does a
 * full navigation and the RSC query cannot go stale. `role="button"` keeps
 * `aria-pressed` legal (RF-2).
 */

const CHIP_BASE =
  "inline-flex min-h-11 items-center rounded-chip border px-[12px] py-[7px] " +
  "font-sans text-[11px] tracking-[0.08em] transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

type FacetProps = {
  children: ReactNode;
  query: CatalogQuery;
  pressed: boolean;
  disabled?: boolean;
};

export function FacetChip({ children, query, pressed, disabled = false }: FacetProps) {
  const locale = useLocale() as Locale;
  const href = catalogUrl(query, locale);
  const className = [
    CHIP_BASE,
    pressed
      ? "border-ink bg-ink text-canvas hover:bg-ink-raised"
      : "border-ink/20 text-ink hover:border-ink/40 hover:bg-ink/5",
    disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:border-ink/20",
  ]
    .filter(Boolean)
    .join(" ");

  if (disabled) {
    return (
      <span
        className={className}
        role="button"
        aria-pressed={pressed}
        aria-disabled="true"
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      role="button"
      aria-pressed={pressed}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(href);
      }}
    >
      {children}
    </a>
  );
}

type RemovableProps = {
  children: ReactNode;
  query: CatalogQuery;
  removeLabel: string;
};

export function RemovableFacetChip({ children, query, removeLabel }: RemovableProps) {
  const locale = useLocale() as Locale;

  return (
    <a
      href={catalogUrl(query, locale)}
      aria-label={removeLabel}
      className={`${CHIP_BASE} gap-2 border-ink bg-ink text-canvas hover:bg-ink-raised`}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(catalogUrl(query, locale));
      }}
    >
      {children}
      <XIcon className="h-[11px] w-[11px] opacity-60" />
    </a>
  );
}
