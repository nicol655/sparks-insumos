import type { Locale } from "@/i18n/locales";
import type { CatalogQuery, Facets, Product, ProductList } from "@/lib/api/contract";

/**
 * The only way the storefront reaches catalogue data. Components never call
 * fetch and never import fixtures directly (ADR-0003).
 *
 * Two implementations satisfy it: `mock-repository` (today) and
 * `http-repository` (once api/ exists). Both are exercised by the same suite.
 */
export interface CatalogRepository {
  listProducts(query: CatalogQuery, locale: Locale): Promise<ProductList>;
  /** Null when no product carries that slug. */
  getProduct(slug: string, locale: Locale): Promise<Product | null>;
  getRelated(slug: string, locale: Locale): Promise<Product[]>;
  getFacets(locale: Locale): Promise<Facets>;
  /** Free-text search for the global overlay; empty below two characters. */
  search(term: string, locale: Locale): Promise<Product[]>;
}

/** Minimum characters before the search overlay queries (§03). */
export const SEARCH_MIN_LENGTH = 2;

/** Results shown live in the search overlay (§03). */
export const SEARCH_RESULT_LIMIT = 4;

/** Related products shown on a product page. */
export const RELATED_LIMIT = 4;
