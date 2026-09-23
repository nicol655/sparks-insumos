"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { Locale } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { catalogQuerySchema, catalogRepository, type Product } from "@/lib/api";
import { SEARCH_MIN_LENGTH } from "@/lib/api/repository";
import {
  buildSearchSuggestions,
  type SearchSuggestion,
} from "@/lib/catalog/suggestions";
import { formatPrice } from "@/lib/format/price";

type Props = {
  term: string;
  onSuggest: (value: string) => void;
};

/**
 * T092 · suggestion chips (note + brand) and a live grid capped at four.
 * Queries go through the repository; the overlay never imports fixtures.
 */
export function LiveResults({ term, onSuggest }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const needle = term.trim();
  const searching = needle.length >= SEARCH_MIN_LENGTH;
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [fetched, setFetched] = useState<{ term: string; items: Product[] } | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      catalogRepository().getFacets(locale),
      catalogRepository().listProducts(catalogQuerySchema.parse({}), locale),
    ]).then(([facets, list]) => {
      if (!cancelled) setSuggestions(buildSearchSuggestions(facets, list.items));
    });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (needle.length < SEARCH_MIN_LENGTH) return;

    let cancelled = false;

    void catalogRepository()
      .search(needle, locale)
      .then((items) => {
        if (!cancelled) setFetched({ term: needle, items });
      });

    return () => {
      cancelled = true;
    };
  }, [needle, locale]);

  const results = searching && fetched?.term === needle ? fetched.items : [];
  const done = searching && fetched?.term === needle;

  return (
    <div className="mt-8">
      {!searching && suggestions.length > 0 ? (
        <div>
          <p className="font-sans text-label tracking-[0.14em] text-text-meta mb-3 uppercase">
            {t("search.suggestions")}
          </p>
          <div
            role="group"
            aria-label={t("search.suggestions")}
            className="flex flex-wrap gap-2"
          >
            {suggestions.map((suggestion) => (
              <button
                key={`${suggestion.kind}-${suggestion.value}`}
                type="button"
                onClick={() => onSuggest(suggestion.value)}
                className={[
                  "inline-flex min-h-11 items-center rounded-chip border border-ink/20 px-[12px] py-[7px]",
                  "font-sans text-[11px] tracking-[0.08em] text-ink",
                  "hover:border-ink/40 hover:bg-ink/5",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                ].join(" ")}
              >
                {suggestion.value}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {done && results.length === 0 ? (
        <p className="text-body-m text-text-muted">{t("search.empty")}</p>
      ) : null}

      {results.length > 0 ? (
        <ul
          id="search-live-results"
          aria-label={t("search.results")}
          className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6"
        >
          {results.map((product) => (
            <li key={product.id}>
              <a
                href={productHref(product.slug, locale)}
                className={[
                  "flex flex-col gap-2 border-b border-border-hairline py-3",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                ].join(" ")}
              >
                <p className="font-mono text-mono-meta text-text-meta tracking-[0.12em] uppercase">
                  {product.brand}
                </p>
                <p className="font-display text-h4">{product.name}</p>
                <p className="font-display text-h4">
                  {formatPrice(product.price.amount, locale)}
                </p>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function productHref(slug: string, locale: Locale): string {
  const names = routing.pathnames["/catalogo/[slug]"];
  const path = (typeof names === "string" ? names : names[locale]).replace("[slug]", slug);
  return `/${locale}${path}`;
}
