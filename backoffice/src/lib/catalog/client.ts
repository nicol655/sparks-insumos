import { z } from "zod";

import { categorySchema, productSchema, tagSchema, type Category, type Product, type Tag } from "@/lib/catalog/contract";
import type { ProductWrite } from "@/lib/catalog/form";
import { INVALID_DETAIL, UNAVAILABLE_DETAIL } from "@/lib/catalog/labels";
import { CATALOG_TOKEN_HEADER } from "@/lib/catalog/token-header";

const TIMEOUT_MS = 10_000;

export type CatalogFailure = {
  ok: false;
  status: number;
  detail: string;
};

export type ProductsResult = { ok: true; products: Product[] } | CatalogFailure;
export type CategoriesResult = { ok: true; categories: Category[] } | CatalogFailure;
export type TagsResult = { ok: true; tags: Tag[] } | CatalogFailure;
export type ProductResult = { ok: true; product: Product } | CatalogFailure;
export type CategoryResult = { ok: true; category: Category } | CatalogFailure;
export type TagResult = { ok: true; tag: Tag } | CatalogFailure;

export type CategoryWrite = {
  name: string;
  parentId: string | null;
};

export type CatalogClient = {
  listProducts(token: string): Promise<ProductsResult>;
  listCategories(token: string): Promise<CategoriesResult>;
  listTags(token: string): Promise<TagsResult>;
  createProduct(input: ProductWrite, token: string): Promise<ProductResult>;
  updateProduct(id: string, body: FormData, token: string): Promise<ProductResult>;
  createCategory(input: CategoryWrite, token: string): Promise<CategoryResult>;
  createTag(input: { name: string }, token: string): Promise<TagResult>;
};

export function isUnauthenticated(result: { ok: boolean; status?: number }): boolean {
  return result.ok === false && result.status === 401;
}

export function detailFrom(payload: unknown): string {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) return UNAVAILABLE_DETAIL;
  const detail = payload.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) return INVALID_DETAIL;
  return UNAVAILABLE_DETAIL;
}

type RequestResult = { ok: true; status: number; payload: unknown } | CatalogFailure;

async function request(
  fetchImpl: typeof fetch,
  url: string,
  token: string,
  init: { method: string; body?: BodyInit; contentType?: string },
): Promise<RequestResult> {
  let response: Response;
  try {
    const headers = new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      [CATALOG_TOKEN_HEADER]: token,
    });
    if (init.contentType) headers.set("Content-Type", init.contentType);
    response = await fetchImpl(url, {
      method: init.method,
      headers,
      body: init.body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, status: 0, detail: UNAVAILABLE_DETAIL };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) return { ok: false, status: response.status, detail: detailFrom(payload) };
  return { ok: true, status: response.status, payload };
}

export function productFormData(input: ProductWrite): FormData {
  const body = new FormData();
  body.set("name", input.name);
  body.set("description", input.description);
  body.set("cost", input.cost);
  body.set("price", input.price);
  body.set("type", input.type);
  body.set("visibility", input.visibility);
  body.set("category_id", input.categoryId);
  for (const photo of input.photos) body.append("photos", photo);
  if (input.weight !== undefined) body.set("weight", input.weight);
  if (input.length !== undefined) body.set("length", input.length);
  if (input.width !== undefined) body.set("width", input.width);
  if (input.height !== undefined) body.set("height", input.height);
  if (input.sku !== undefined) body.set("sku", input.sku);
  if (input.barCode !== undefined) body.set("bar_code", input.barCode);
  if (input.brand !== undefined) body.set("brand", input.brand);
  body.set("family", input.family);
  body.set("size_ml", input.sizeMl);
  if (input.discount !== undefined) body.set("discount", input.discount);
  for (const id of input.tagIds) body.append("tag_ids", id);
  return body;
}

export function createCatalogClient(baseUrl: string, fetchImpl: typeof fetch = fetch): CatalogClient {
  const root = baseUrl.replace(/\/$/, "");

  return {
    async listProducts(token) {
      const result = await request(fetchImpl, `${root}/products`, token, { method: "GET" });
      if (!result.ok) return result;
      const parsed = z.array(productSchema).safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, products: parsed.data };
    },

    async listCategories(token) {
      const result = await request(fetchImpl, `${root}/product-categories`, token, { method: "GET" });
      if (!result.ok) return result;
      const parsed = z.array(categorySchema).safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, categories: parsed.data };
    },

    async listTags(token) {
      const result = await request(fetchImpl, `${root}/tags`, token, { method: "GET" });
      if (!result.ok) return result;
      const parsed = z.array(tagSchema).safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, tags: parsed.data };
    },

    async createProduct(input, token) {
      const result = await request(fetchImpl, `${root}/products`, token, {
        method: "POST",
        body: productFormData(input),
      });
      if (!result.ok) return result;
      const parsed = productSchema.safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, product: parsed.data };
    },

    async updateProduct(id, body, token) {
      const result = await request(fetchImpl, `${root}/products/${id}`, token, {
        method: "PATCH",
        body,
      });
      if (!result.ok) return result;
      const parsed = productSchema.safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, product: parsed.data };
    },

    async createCategory(input, token) {
      const payload: { name: string; product_category_id?: string } = { name: input.name };
      if (input.parentId) payload.product_category_id = input.parentId;
      const result = await request(fetchImpl, `${root}/product-categories`, token, {
        method: "POST",
        body: JSON.stringify(payload),
        contentType: "application/json",
      });
      if (!result.ok) return result;
      const parsed = categorySchema.safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, category: parsed.data };
    },

    async createTag(input, token) {
      const result = await request(fetchImpl, `${root}/tags`, token, {
        method: "POST",
        body: JSON.stringify({ name: input.name }),
        contentType: "application/json",
      });
      if (!result.ok) return result;
      const parsed = tagSchema.safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, tag: parsed.data };
    },
  };
}
