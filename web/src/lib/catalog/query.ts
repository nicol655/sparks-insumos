import {
  catalogQuerySchema,
  type CatalogQuery,
  type Facets,
  type Product,
  type ProductSort,
} from "@/lib/api/contract";

/**
 * Matching rules the mock repository (and, later, `api/`) apply. The sidebar
 * uses the same function to dim chips that would leave the grid empty (RF-2).
 */

export const PRICE_BUCKETS = [
  { id: "low", priceMin: undefined, priceMax: 30_000 },
  { id: "mid", priceMin: 30_000, priceMax: 50_000 },
  { id: "high", priceMin: 50_000, priceMax: undefined },
] as const;

export type PriceBucketId = (typeof PRICE_BUCKETS)[number]["id"];

export type UnavailableFacets = {
  families: string[];
  brands: string[];
  sizes: number[];
  priceBuckets: PriceBucketId[];
};

export function productMatchesQuery(product: Product, query: CatalogQuery): boolean {
  const needle = query.q ? normalize(query.q) : null;

  if (query.families.length > 0 && !query.families.includes(product.family)) return false;
  if (query.brands.length > 0 && !query.brands.includes(product.brand)) return false;
  if (query.sizes.length > 0 && !query.sizes.includes(product.size.ml)) return false;
  if (query.priceMin !== undefined && product.price.amount < query.priceMin) return false;
  if (query.priceMax !== undefined && product.price.amount > query.priceMax) return false;
  if (needle && !searchIndex(product).includes(needle)) return false;

  return true;
}

/** Everything a shopper might type: brand, name, family, notes. */
export function searchIndex(product: Product): string {
  return normalize(
    [
      product.brand,
      product.name,
      product.family,
      product.concentration,
      ...product.notes.top,
      ...product.notes.heart,
      ...product.notes.base,
    ].join(" "),
  );
}

/** Lowercase and strip accents so "jazmin" finds "Jazmín". */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function hasActiveFilters(query: CatalogQuery): boolean {
  return (
    query.families.length > 0 ||
    query.brands.length > 0 ||
    query.sizes.length > 0 ||
    query.priceMin !== undefined ||
    query.priceMax !== undefined ||
    Boolean(query.q)
  );
}

export function withToggledFamily(query: CatalogQuery, value: string): CatalogQuery {
  return { ...query, families: toggle(query.families, value) };
}

export function withToggledBrand(query: CatalogQuery, value: string): CatalogQuery {
  return { ...query, brands: toggle(query.brands, value) };
}

export function withToggledSize(query: CatalogQuery, value: number): CatalogQuery {
  return { ...query, sizes: toggle(query.sizes, value) };
}

export function withPriceBucket(query: CatalogQuery, id: PriceBucketId): CatalogQuery {
  if (activePriceBucket(query) === id) {
    return { ...query, priceMin: undefined, priceMax: undefined };
  }

  const bucket = PRICE_BUCKETS.find((item) => item.id === id);
  if (!bucket) return query;

  return { ...query, priceMin: bucket.priceMin, priceMax: bucket.priceMax };
}

export function withSort(query: CatalogQuery, sort: ProductSort): CatalogQuery {
  return { ...query, sort };
}

export function withoutFamily(query: CatalogQuery, value: string): CatalogQuery {
  return { ...query, families: query.families.filter((item) => item !== value) };
}

export function withoutBrand(query: CatalogQuery, value: string): CatalogQuery {
  return { ...query, brands: query.brands.filter((item) => item !== value) };
}

export function withoutSize(query: CatalogQuery, value: number): CatalogQuery {
  return { ...query, sizes: query.sizes.filter((item) => item !== value) };
}

export function withoutPrice(query: CatalogQuery): CatalogQuery {
  return { ...query, priceMin: undefined, priceMax: undefined };
}

export function withoutQueryText(query: CatalogQuery): CatalogQuery {
  return { ...query, q: undefined };
}

export function withClearedFilters(query: CatalogQuery): CatalogQuery {
  return catalogQuerySchema.parse({ sort: query.sort });
}

export function activePriceBucket(query: CatalogQuery): PriceBucketId | null {
  for (const bucket of PRICE_BUCKETS) {
    if (query.priceMin === bucket.priceMin && query.priceMax === bucket.priceMax) {
      return bucket.id;
    }
  }

  return null;
}

export function unavailableFacets(
  products: Product[],
  query: CatalogQuery,
  facets: Pick<Facets, "families" | "brands" | "sizes">,
): UnavailableFacets {
  return {
    families: facets.families
      .map((facet) => facet.value)
      .filter((value) => !query.families.includes(value))
      .filter(
        (value) =>
          !products.some((product) =>
            productMatchesQuery(product, { ...query, families: [...query.families, value] }),
          ),
      ),
    brands: facets.brands
      .map((facet) => facet.value)
      .filter((value) => !query.brands.includes(value))
      .filter(
        (value) =>
          !products.some((product) =>
            productMatchesQuery(product, { ...query, brands: [...query.brands, value] }),
          ),
      ),
    sizes: facets.sizes
      .map((facet) => facet.value)
      .filter((value) => !query.sizes.includes(value))
      .filter(
        (value) =>
          !products.some((product) =>
            productMatchesQuery(product, { ...query, sizes: [...query.sizes, value] }),
          ),
      ),
    priceBuckets: PRICE_BUCKETS.map((bucket) => bucket.id).filter((id) => {
      if (activePriceBucket(query) === id) return false;
      const bucket = PRICE_BUCKETS.find((item) => item.id === id)!;
      return !products.some((product) =>
        productMatchesQuery(product, {
          ...query,
          priceMin: bucket.priceMin,
          priceMax: bucket.priceMax,
        }),
      );
    }),
  };
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
