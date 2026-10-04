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
      const matches =         sortProducts(
        catalogFor(locale).filter((product) => productMatchesQuery(product, query)),
        query.sort,
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

function sortProducts(products: Product[], sort: CatalogQuery["sort"]): Product[] {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price.amount - b.price.amount || byName(a, b));
    case "price-desc":
      return sorted.sort((a, b) => b.price.amount - a.price.amount || byName(a, b));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name, "es") || a.id.localeCompare(b.id));
    case "name-asc":
      return sorted.sort(byName);
  }
}

function byName(a: Product, b: Product): number {
  return a.name.localeCompare(b.name, "es") || a.id.localeCompare(b.id);
}

function buildFacets(catalog: Product[]): Facets {
  const prices = catalog.map((product) => product.price.amount);

  return {
    families: countBy(catalog, (product) => product.family),
    brands: countBy(catalog, (product) => product.brand),
    sizes: [...tally(catalog.flatMap((product) => (product.size ? [product.size.ml] : [])))]
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

