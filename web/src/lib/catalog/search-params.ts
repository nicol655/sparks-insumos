import type { Locale } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import {
  catalogQuerySchema,
  productSortSchema,
  type CatalogQuery,
} from "@/lib/api/contract";

/**
 * Catalogue filters live in the URL (RF-2, AC-9). The query string is the
 * source of truth: sharing or reloading it must reproduce the same grid.
 *
 * Repeated keys (`family`, `brand`, `size`) are a union within that facet;
 * distinct keys combine as an intersection. The HTTP adapter talks to `api/`
 * with the same names, so a round-trip through this module is what the
 * backend has to honour.
 */

export const DEFAULT_SORT = catalogQuerySchema.parse({}).sort;

export type SearchValues = Record<string, string | string[] | undefined>;

/** Browser and HTTP serialisation. Default sort is omitted so URLs stay clean. */
export function toSearchParams(query: CatalogQuery): URLSearchParams {
  const params = new URLSearchParams();

  for (const family of query.families) params.append("family", family);
  for (const brand of query.brands) params.append("brand", brand);
  for (const size of query.sizes) params.append("size", String(size));
  if (query.priceMin !== undefined) params.set("priceMin", String(query.priceMin));
  if (query.priceMax !== undefined) params.set("priceMax", String(query.priceMax));
  if (query.q) params.set("q", query.q);
  if (query.sort !== DEFAULT_SORT) params.set("sort", query.sort);

  return params;
}

export function fromSearchParams(params: URLSearchParams): CatalogQuery {
  return catalogQuerySchema.parse({
    families: params.getAll("family").filter(Boolean),
    brands: params.getAll("brand").filter(Boolean),
    sizes: params
      .getAll("size")
      .map(Number)
      .filter((value) => Number.isInteger(value) && value > 0),
    priceMin: optionalNonNegativeInt(params.get("priceMin")),
    priceMax: optionalNonNegativeInt(params.get("priceMax")),
    q: params.get("q")?.trim() || undefined,
    sort: parseSort(params.get("sort")),
  });
}

/** Next.js `searchParams` arrive as a plain object, not a URLSearchParams. */
export function fromSearchValues(values: SearchValues): CatalogQuery {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== "") params.append(key, item);
    }
  }

  return fromSearchParams(params);
}

/**
 * Shape next-intl's router accepts for `query`. Repeated keys become arrays
 * so `family=a&family=b` survives a language switch.
 */
export function toQueryRecord(query: CatalogQuery): Record<string, string | string[]> {
  return queryRecordFromSearchParams(toSearchParams(query));
}

export type CatalogHref =
  | { pathname: "/catalogo" }
  | { pathname: "/catalogo"; query: Record<string, string | string[]> };

/** next-intl `Link` href for the next catalogue state (ADR-0007). */
export function catalogLink(query: CatalogQuery): CatalogHref {
  const record = toQueryRecord(query);
  return Object.keys(record).length > 0
    ? { pathname: "/catalogo", query: record }
    : { pathname: "/catalogo" };
}

/**
 * Concrete `/es/catalogo?…` URL. A native `<a>` (not next-intl `Link`) so a
 * hydrated client does a full navigation and the RSC query cannot go stale.
 */
export function catalogUrl(query: CatalogQuery, locale: Locale): string {
  const names = routing.pathnames["/catalogo"];
  const path = typeof names === "string" ? names : names[locale];
  const search = toSearchParams(query).toString();
  const href = `/${locale}${path}`;
  return search ? `${href}?${search}` : href;
}

export function queryRecordFromSearchParams(
  params: URLSearchParams,
): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};

  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    if (all.length === 1) {
      record[key] = all[0]!;
    } else if (all.length > 1) {
      record[key] = all;
    }
  }

  return record;
}

function optionalNonNegativeInt(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return undefined;
  return value;
}

function parseSort(raw: string | null): CatalogQuery["sort"] | undefined {
  if (!raw) return undefined;
  const parsed = productSortSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}
