"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { FacetChip } from "@/components/catalog/facet-chip";
import { usePriceBucketLabel } from "@/components/catalog/price-labels";
import type { CatalogQuery, Facets } from "@/lib/api/contract";
import { FAMILY_MESSAGE, isFamilySlug } from "@/lib/catalog/families";
import {
  PRICE_BUCKETS,
  activePriceBucket,
  type UnavailableFacets,
  withPriceBucket,
  withToggledBrand,
  withToggledFamily,
  withToggledSize,
} from "@/lib/catalog/query";

type Props = {
  query: CatalogQuery;
  facets: Facets;
  unavailable: UnavailableFacets;
};

/**
 * T063 · US-3. Facet groups with an eyebrow heading and toggle chips.
 * Each chip is a link so the URL updates without client navigation (AC-9).
 * A combination that would empty the grid is dimmed to 40% (RF-2).
 */
export function FilterSidebar({ query, facets, unavailable }: Props) {
  const t = useTranslations();
  const priceLabel = usePriceBucketLabel();
  const pressedBucket = activePriceBucket(query);

  return (
    <div className="flex flex-col gap-8">
      <FilterGroup title={t("catalog.families")}>
        {facets.families.map((facet) => (
          <FacetChip
            key={facet.value}
            query={withToggledFamily(query, facet.value)}
            pressed={query.families.includes(facet.value)}
            disabled={unavailable.families.includes(facet.value)}
          >
            {isFamilySlug(facet.value) ? t(FAMILY_MESSAGE[facet.value]) : facet.value}
          </FacetChip>
        ))}
      </FilterGroup>

      <FilterGroup title={t("catalog.brands")}>
        {facets.brands.map((facet) => (
          <FacetChip
            key={facet.value}
            query={withToggledBrand(query, facet.value)}
            pressed={query.brands.includes(facet.value)}
            disabled={unavailable.brands.includes(facet.value)}
          >
            {facet.value}
          </FacetChip>
        ))}
      </FilterGroup>

      <FilterGroup title={t("catalog.sizes")}>
        {facets.sizes.map((facet) => (
          <FacetChip
            key={facet.value}
            query={withToggledSize(query, facet.value)}
            pressed={query.sizes.includes(facet.value)}
            disabled={unavailable.sizes.includes(facet.value)}
          >
            {t("catalog.sizeLabel", { ml: facet.value })}
          </FacetChip>
        ))}
      </FilterGroup>

      <FilterGroup title={t("catalog.price")}>
        {PRICE_BUCKETS.map((bucket) => (
          <FacetChip
            key={bucket.id}
            query={withPriceBucket(query, bucket.id)}
            pressed={pressedBucket === bucket.id}
            disabled={unavailable.priceBuckets.includes(bucket.id)}
          >
            {priceLabel(bucket.id)}
          </FacetChip>
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();

  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <p id={id} className="text-eyebrow text-text-meta uppercase">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
