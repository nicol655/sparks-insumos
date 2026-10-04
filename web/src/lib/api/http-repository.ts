import type { Locale } from "@/i18n/locales";
import { facetsSchema, type Product } from "@/lib/api/contract";
import {
  type CatalogRepository,
  SEARCH_MIN_LENGTH,
  SEARCH_RESULT_LIMIT,
} from "@/lib/api/repository";
import { toSearchParams } from "@/lib/catalog/search-params";
import { z } from "zod";

const storeProductSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().nonnegative(),
  brand: z.string().nullable(),
  family: z.string().nullable(),
  size_ml: z.number().int().positive().nullable(),
  photo_urls: z.array(z.string()),
});

type StoreProduct = z.infer<typeof storeProductSchema>;

function pesos(amount: number): number {
  return Math.round(amount);
}

function toProduct(row: StoreProduct): Product {
  const photos = row.photo_urls.filter((url) => url.length > 0);
  return {
    id: row.id,
    slug: row.id,
    brand: row.brand ?? "",
    name: row.name,
    family: row.family ?? "",
    concentration: "",
    size: row.size_ml === null ? null : { ml: row.size_ml, label: `${row.size_ml} ml` },
    price: { amount: pesos(row.price), currency: "ARS" },
    notes: { top: [], heart: [], base: [] },
    description: row.description,
    stock: null,
    images: {
      packshot: photos[0] ?? null,
      thumbnails: photos.slice(1, 4),
      alt: row.name,
    },
  };
}

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
      const params = toSearchParams(query);
      params.set("limit", "100");
      const rows = await request("/products", z.array(storeProductSchema), locale, params);
      const items = rows.map(toProduct);
      return { items, total: items.length };
    },

    async getProduct(slug, locale) {
      try {
        const row = await request(`/products/${encodeURIComponent(slug)}`, storeProductSchema, locale);
        return toProduct(row);
      } catch (error) {
        if (error instanceof CatalogRequestError && error.status === 404) return null;
        throw error;
      }
    },

    async getRelated() {
      return [];
    },

    async getFacets(locale) {
      return request("/products/facets", facetsSchema, locale);
    },

    async search(term, locale) {
      if (term.trim().length < SEARCH_MIN_LENGTH) return [];

      const params = new URLSearchParams({ q: term.trim(), limit: String(SEARCH_RESULT_LIMIT) });
      const rows = await request("/products", z.array(storeProductSchema), locale, params);
      return rows.map(toProduct);
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
