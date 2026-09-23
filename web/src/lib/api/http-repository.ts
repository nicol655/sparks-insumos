import type { Locale } from "@/i18n/locales";
import {
  ENDPOINTS,
  facetsSchema,
  productListSchema,
  productSchema,
} from "@/lib/api/contract";
import {
  type CatalogRepository,
  RELATED_LIMIT,
  SEARCH_MIN_LENGTH,
  SEARCH_RESULT_LIMIT,
} from "@/lib/api/repository";
import { toSearchParams } from "@/lib/catalog/search-params";
import { z } from "zod";

/**
 * Talks to the api/ service. Every response is parsed against the contract, so
 * a backend that drifts fails loudly and at the boundary instead of surfacing
 * as an undefined three components deeper (ADR-0003).
 */
export function createHttpCatalogRepository(baseUrl: string): CatalogRepository {
  const request = async <T>(
    path: string,
    schema: z.ZodType<T>,
    locale: Locale,
    params?: URLSearchParams,
  ): Promise<T> => {
    const url = new URL(path, baseUrl);
    if (params) url.search = params.toString();

    const response = await fetch(url, {
      headers: { Accept: "application/json", "Accept-Language": locale },
    });

    if (!response.ok) {
      throw new CatalogRequestError(url.toString(), response.status);
    }

    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new CatalogContractError(url.toString(), z.prettifyError(parsed.error));
    }

    return parsed.data;
  };

  return {
    async listProducts(query, locale) {
      return request(ENDPOINTS.products, productListSchema, locale, toSearchParams(query));
    },

    async getProduct(slug, locale) {
      try {
        return await request(ENDPOINTS.product(slug), productSchema, locale);
      } catch (error) {
        if (error instanceof CatalogRequestError && error.status === 404) return null;
        throw error;
      }
    },

    async getRelated(slug, locale) {
      const params = new URLSearchParams({ limit: String(RELATED_LIMIT) });

      return request(ENDPOINTS.related(slug), z.array(productSchema), locale, params);
    },

    async getFacets(locale) {
      return request(ENDPOINTS.facets, facetsSchema, locale);
    },

    async search(term, locale) {
      if (term.trim().length < SEARCH_MIN_LENGTH) return [];

      const params = new URLSearchParams({ q: term.trim(), limit: String(SEARCH_RESULT_LIMIT) });

      return request(ENDPOINTS.search, z.array(productSchema), locale, params);
    },
  };
}

export { toSearchParams } from "@/lib/catalog/search-params";

export class CatalogRequestError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`Catalog request failed: ${status} for ${url}`);
    this.name = "CatalogRequestError";
  }
}

export class CatalogContractError extends Error {
  constructor(
    readonly url: string,
    readonly details: string,
  ) {
    super(`Catalog response does not satisfy the contract (${url}):\n${details}`);
    this.name = "CatalogContractError";
  }
}
