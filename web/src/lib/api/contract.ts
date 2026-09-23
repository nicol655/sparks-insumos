import { z } from "zod";

/**
 * Contract between the storefront and the future `api/` service.
 *
 * This file is the source of truth: the TypeScript types are inferred from the
 * schemas, never the other way round, and every HTTP response is validated
 * against them at runtime. When `api/` is built it must satisfy exactly this —
 * the suites in ./__tests__ run against both adapters for that reason.
 *
 * See ADR-0003.
 */

/** Products are priced in Argentine pesos, whole units (§06). */
export const moneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.literal("ARS"),
});

/**
 * Olfactive family and concentration travel as slugs, not as display text: the
 * label is translated in the UI dictionary under `families.<slug>`. Brand and
 * product name are proper nouns and are never translated.
 */
export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  brand: z.string().min(1),
  name: z.string().min(1),
  family: z.string().min(1),
  concentration: z.string().min(1),
  size: z.object({
    ml: z.number().int().positive(),
    label: z.string().min(1),
  }),
  price: moneySchema,
  notes: z.object({
    top: z.array(z.string().min(1)).min(1),
    heart: z.array(z.string().min(1)).min(1),
    base: z.array(z.string().min(1)).min(1),
  }),
  description: z.string().min(1),
  stock: z.number().int().nonnegative(),
  /** Free text badge shown top-left on the card, e.g. "Nuevo". */
  badge: z.string().min(1).optional(),
  images: z.object({
    /** Null until the product has been shot; the UI draws the §05 placeholder. */
    packshot: z.string().min(1).nullable(),
    thumbnails: z.array(z.string().min(1)).max(3),
    /** AC-20: mandatory and descriptive. */
    alt: z.string().min(1),
  }),
});

/**
 * Catalogue ordering.
 *
 * PROVISIONAL — RF-3 points at "los ordenamientos del prototipo", which could
 * not be read: interactions inside the artifact iframe do not register. This
 * set covers the obvious cases; confirm against the prototype before the
 * catalogue ships.
 */
export const productSortSchema = z.enum(["relevance", "price-asc", "price-desc", "name-asc"]);

export const catalogQuerySchema = z.object({
  families: z.array(z.string().min(1)).default([]),
  brands: z.array(z.string().min(1)).default([]),
  /** Bottle sizes in millilitres. */
  sizes: z.array(z.number().int().positive()).default([]),
  priceMin: z.number().int().nonnegative().optional(),
  priceMax: z.number().int().nonnegative().optional(),
  /** Free text, also fed by the global search overlay. */
  q: z.string().optional(),
  sort: productSortSchema.default("relevance"),
});

export const productListSchema = z.object({
  items: z.array(productSchema),
  /** Matches before pagination, so the UI can say how many were found. */
  total: z.number().int().nonnegative(),
});

/** One selectable value plus how many products it would leave (RF-2). */
export const facetValueSchema = z.object({
  value: z.string().min(1),
  count: z.number().int().nonnegative(),
});

export const facetsSchema = z.object({
  families: z.array(facetValueSchema),
  brands: z.array(facetValueSchema),
  sizes: z.array(
    z.object({
      value: z.number().int().positive(),
      count: z.number().int().nonnegative(),
    }),
  ),
  price: z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
  }),
});

export type Money = z.infer<typeof moneySchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductSort = z.infer<typeof productSortSchema>;
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
export type CatalogQueryInput = z.input<typeof catalogQuerySchema>;
export type ProductList = z.infer<typeof productListSchema>;
export type Facets = z.infer<typeof facetsSchema>;
export type FacetValue = z.infer<typeof facetValueSchema>;

/** Endpoints the future api/ service must expose. */
export const ENDPOINTS = {
  products: "/api/v1/products",
  product: (slug: string) => `/api/v1/products/${encodeURIComponent(slug)}`,
  related: (slug: string) => `/api/v1/products/${encodeURIComponent(slug)}/related`,
  facets: "/api/v1/facets",
  search: "/api/v1/search",
} as const;
