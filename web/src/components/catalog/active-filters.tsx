"use client";

import { useLocale, useTranslations } from "next-intl";

import { RemovableFacetChip } from "@/components/catalog/facet-chip";
import { useCustomPriceLabel, usePriceBucketLabel } from "@/components/catalog/price-labels";
import type { Locale } from "@/i18n/locales";
import type { CatalogQuery } from "@/lib/api/contract";
import { FAMILY_MESSAGE, isFamilySlug } from "@/lib/catalog/families";
import {
  activePriceBucket,
  hasActiveFilters,
  withClearedFilters,
  withoutBrand,
  withoutFamily,
  withoutPrice,
  withoutQueryText,
  withoutSize,
} from "@/lib/catalog/query";
import { catalogUrl } from "@/lib/catalog/search-params";

type Props = {
  query: CatalogQuery;
};

/**
 * T064 · applied filters sit above the grid as removable chips (RF-2).
 * Each chip (and "clear") is a link so removing a filter works without JS.
 */
export function ActiveFilters({ query }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const priceLabel = usePriceBucketLabel();
  const customLabel = useCustomPriceLabel();
  const bucket = activePriceBucket(query);

  if (!hasActiveFilters(query)) return null;

  const customPrice =
    bucket === null && (query.priceMin !== undefined || query.priceMax !== undefined);

  const cleared = withClearedFilters(query);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {query.families.map((value) => {
        const label = isFamilySlug(value) ? t(FAMILY_MESSAGE[value]) : value;
        return (
          <RemovableFacetChip
            key={`family-${value}`}
            query={withoutFamily(query, value)}
            removeLabel={t("catalog.removeFilter", { label })}
          >
            {label}
          </RemovableFacetChip>
        );
      })}
      {query.brands.map((value) => (
        <RemovableFacetChip
          key={`brand-${value}`}
          query={withoutBrand(query, value)}
          removeLabel={t("catalog.removeFilter", { label: value })}
        >
          {value}
        </RemovableFacetChip>
      ))}
      {query.sizes.map((value) => {
        const label = t("catalog.sizeLabel", { ml: value });
        return (
          <RemovableFacetChip
            key={`size-${value}`}
            query={withoutSize(query, value)}
            removeLabel={t("catalog.removeFilter", { label })}
          >
            {label}
          </RemovableFacetChip>
        );
      })}
      {bucket ? (
        <RemovableFacetChip
          query={withoutPrice(query)}
          removeLabel={t("catalog.removeFilter", { label: priceLabel(bucket) })}
        >
          {priceLabel(bucket)}
        </RemovableFacetChip>
      ) : null}
      {customPrice ? (
        <RemovableFacetChip
          query={withoutPrice(query)}
          removeLabel={t("catalog.removeFilter", { label: t("catalog.price") })}
        >
          {customLabel(query)}
        </RemovableFacetChip>
      ) : null}
      {query.q ? (
        <RemovableFacetChip
          query={withoutQueryText(query)}
          removeLabel={t("catalog.removeFilter", { label: query.q })}
        >
          {query.q}
        </RemovableFacetChip>
      ) : null}
      <a
        href={catalogUrl(cleared, locale)}
        className="inline-flex min-h-11 items-center font-sans text-[11px] tracking-[0.08em] uppercase underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        onClick={(event) => {
          event.preventDefault();
          window.location.assign(catalogUrl(cleared, locale));
        }}
      >
        {t("catalog.clearFilters")}
      </a>
    </div>
  );
}
