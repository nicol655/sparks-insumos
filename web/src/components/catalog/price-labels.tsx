"use client";

import { useLocale, useTranslations } from "next-intl";

import type { CatalogQuery } from "@/lib/api/contract";
import { PRICE_BUCKETS, type PriceBucketId } from "@/lib/catalog/query";
import { formatPrice } from "@/lib/format/price";
import type { Locale } from "@/i18n/locales";

/** Price-bucket copy, shared by the sidebar chips and the removable pills. */
export function usePriceBucketLabel() {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  return (id: PriceBucketId) => {
    const bucket = PRICE_BUCKETS.find((item) => item.id === id)!;

    if (bucket.priceMin === undefined && bucket.priceMax !== undefined) {
      return t("catalog.priceLow", { price: formatPrice(bucket.priceMax, locale) });
    }
    if (bucket.priceMin !== undefined && bucket.priceMax !== undefined) {
      return t("catalog.priceMid", {
        min: formatPrice(bucket.priceMin, locale),
        max: formatPrice(bucket.priceMax, locale),
      });
    }
    return t("catalog.priceHigh", { price: formatPrice(bucket.priceMin ?? 0, locale) });
  };
}

export function useCustomPriceLabel() {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  return (query: CatalogQuery) => {
    if (query.priceMin !== undefined && query.priceMax !== undefined) {
      return t("catalog.priceMid", {
        min: formatPrice(query.priceMin, locale),
        max: formatPrice(query.priceMax, locale),
      });
    }
    if (query.priceMax !== undefined) {
      return t("catalog.priceLow", { price: formatPrice(query.priceMax, locale) });
    }
    if (query.priceMin !== undefined) {
      return t("catalog.priceHigh", { price: formatPrice(query.priceMin, locale) });
    }
    return t("catalog.price");
  };
}
