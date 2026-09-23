"use client";

import { useTranslations } from "next-intl";

import { Select } from "@/components/primitives/select";
import { productSortSchema, type CatalogQuery, type ProductSort } from "@/lib/api/contract";
import { useCatalogQuery } from "@/lib/catalog/use-catalog-query";

type Props = {
  query: CatalogQuery;
};

const SORT_MESSAGE = {
  relevance: "catalog.sortRelevance",
  "price-asc": "catalog.sortPriceAsc",
  "price-desc": "catalog.sortPriceDesc",
  "name-asc": "catalog.sortNameAsc",
} as const;

/**
 * T064 · RF-3. Native select with the underline treatment from §03.
 * Values are provisional until the prototype sorts are confirmed.
 */
export function SortSelect({ query }: Props) {
  const t = useTranslations();
  const { setSort } = useCatalogQuery(query);

  return (
    <Select
      label={t("catalog.sort")}
      value={query.sort}
      onChange={(event) => {
        const parsed = productSortSchema.safeParse(event.target.value);
        if (parsed.success) setSort(parsed.data);
      }}
      options={(Object.keys(SORT_MESSAGE) as ProductSort[]).map((value) => ({
        value,
        label: t(SORT_MESSAGE[value]),
      }))}
    />
  );
}
