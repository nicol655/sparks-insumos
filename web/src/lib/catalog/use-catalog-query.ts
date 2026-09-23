"use client";

import type { CatalogQuery, ProductSort } from "@/lib/api/contract";
import {
  type PriceBucketId,
  withClearedFilters,
  withPriceBucket,
  withSort,
  withToggledBrand,
  withToggledFamily,
  withToggledSize,
  withoutBrand,
  withoutFamily,
  withoutPrice,
  withoutQueryText,
  withoutSize,
} from "@/lib/catalog/query";
import { toSearchParams } from "@/lib/catalog/search-params";

/**
 * Writes the next catalogue query onto the current path.
 *
 * Client routers (next/navigation and next-intl) both drop or ignore the
 * search string when the pathname stays `/catalogo`. A same-document assign
 * keeps the locale prefix and is what AC-9 actually needs.
 */
export function catalogHref(query: CatalogQuery, pathname: string): string {
  const qs = toSearchParams(query).toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function useCatalogQuery(query: CatalogQuery) {
  function commit(next: CatalogQuery) {
    window.location.assign(catalogHref(next, window.location.pathname));
  }

  return {
    commit,
    toggleFamily: (value: string) => commit(withToggledFamily(query, value)),
    toggleBrand: (value: string) => commit(withToggledBrand(query, value)),
    toggleSize: (value: number) => commit(withToggledSize(query, value)),
    togglePriceBucket: (id: PriceBucketId) => commit(withPriceBucket(query, id)),
    setSort: (sort: ProductSort) => commit(withSort(query, sort)),
    removeFamily: (value: string) => commit(withoutFamily(query, value)),
    removeBrand: (value: string) => commit(withoutBrand(query, value)),
    removeSize: (value: number) => commit(withoutSize(query, value)),
    removePrice: () => commit(withoutPrice(query)),
    removeQueryText: () => commit(withoutQueryText(query)),
    clearFilters: () => commit(withClearedFilters(query)),
  };
}
