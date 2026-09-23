import { catalogFor } from "@/fixtures/catalog";
import type { CatalogQuery, Facets, Product } from "@/lib/api/contract";
import {
  type CatalogRepository,
  RELATED_LIMIT,
  SEARCH_MIN_LENGTH,
  SEARCH_RESULT_LIMIT,
} from "@/lib/api/repository";
import { normalize, productMatchesQuery, searchIndex } from "@/lib/catalog/query";

/**
 * Resolves the contract against the placeholder fixtures.
 *
 * The filtering and ordering semantics here are the specification the future
 * api/ service has to match — the contract tests run this and the HTTP adapter
 * through the same assertions.
 */
export function createMockCatalogRepository(): CatalogRepository {
  return {
    async listProducts(query, locale) {
      const matches = sortProducts(
        catalogFor(locale).filter((product) => productMatchesQuery(product, query)),
        query.sort,
        query.q,
      );

      return { items: matches, total: matches.length };
    },

    async getProduct(slug, locale) {
      return catalogFor(locale).find((product) => product.slug === slug) ?? null;
    },

    async getRelated(slug, locale) {
      const catalog = catalogFor(locale);
      const current = catalog.find((product) => product.slug === slug);
      if (!current) return [];

      // Same olfactive family first, then same brand, never the product itself.
      const sameFamily = catalog.filter(
        (product) => product.slug !== slug && product.family === current.family,
      );
      const sameBrand = catalog.filter(
        (product) =>
          product.slug !== slug &&
          product.family !== current.family &&
          product.brand === current.brand,
      );

      return [...sameFamily, ...sameBrand].slice(0, RELATED_LIMIT);
    },

    async getFacets(locale) {
      return buildFacets(catalogFor(locale));
    },

    async search(term, locale) {
      const needle = normalize(term);
      if (needle.length < SEARCH_MIN_LENGTH) return [];

      return catalogFor(locale)
        .filter((product) => searchIndex(product).includes(needle))
        .slice(0, SEARCH_RESULT_LIMIT);
    },
  };
}

function sortProducts(products: Product[], sort: CatalogQuery["sort"], term?: string): Product[] {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price.amount - b.price.amount || byName(a, b));
    case "price-desc":
      return sorted.sort((a, b) => b.price.amount - a.price.amount || byName(a, b));
    case "name-asc":
      return sorted.sort(byName);
    case "relevance":
      // Without a search term "relevance" means in-stock first, then by name:
      // a sold-out bottle should not head the grid.
      return sorted.sort(
        (a, b) => Number(b.stock > 0) - Number(a.stock > 0) || relevance(b, term) - relevance(a, term) || byName(a, b),
      );
  }
}

/** Name matches outrank note matches when the shopper typed something. */
function relevance(product: Product, term?: string): number {
  if (!term) return 0;

  const needle = normalize(term);
  if (normalize(product.name).startsWith(needle)) return 3;
  if (normalize(`${product.brand} ${product.name}`).includes(needle)) return 2;
  if (searchIndex(product).includes(needle)) return 1;

  return 0;
}

function byName(a: Product, b: Product): number {
  return `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, "es");
}

function buildFacets(catalog: Product[]): Facets {
  const prices = catalog.map((product) => product.price.amount);

  return {
    families: countBy(catalog, (product) => product.family),
    brands: countBy(catalog, (product) => product.brand),
    sizes: [...tally(catalog.map((product) => product.size.ml))]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value - b.value),
    price: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    },
  };
}

function countBy(catalog: Product[], pick: (product: Product) => string) {
  return [...tally(catalog.map(pick))]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value, "es"));
}

function tally<T>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

  return counts;
}

