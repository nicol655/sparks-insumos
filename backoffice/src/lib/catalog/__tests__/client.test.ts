import { describe, expect, it, vi } from "vitest";

import { createCatalogClient } from "@/lib/catalog/client";
import { CATALOG_TOKEN_HEADER } from "@/lib/catalog/token-header";
import type { ProductWrite } from "@/lib/catalog/form";
import { INVALID_DETAIL, PHOTO_MESSAGE, UNAVAILABLE_DETAIL } from "@/lib/catalog/labels";

const categoryId = "11111111-1111-4111-8111-111111111111";

const write: ProductWrite = {
  name: "Rosa",
  description: "Una rosa",
  cost: "10.50",
  price: "20",
  type: "physical",
  visibility: "visible",
  categoryId,
  photos: [new File([new Uint8Array([1])], "rosa.png", { type: "image/png" })],
  family: "florales",
  sizeMl: "100",
  tagIds: [],
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("catalog client errors", () => {
  it("keeps a text detail and flattens a validation list", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(422, { detail: PHOTO_MESSAGE }))
      .mockResolvedValueOnce(jsonResponse(422, { detail: [{ loc: ["body", "name"], msg: "Field required" }] }));
    const client = createCatalogClient("http://catalog.test/", fetchImpl);

    await expect(client.createProduct(write, "tok")).resolves.toEqual({
      ok: false,
      status: 422,
      detail: PHOTO_MESSAGE,
    });
    await expect(client.createProduct(write, "tok")).resolves.toEqual({
      ok: false,
      status: 422,
      detail: INVALID_DETAIL,
    });

    const firstCall = fetchImpl.mock.calls[0];
    expect(firstCall?.[0]).toBe("http://catalog.test/products");
    const sent = new Headers(firstCall?.[1]?.headers);
    expect(sent.get("Authorization")).toBe("Bearer tok");
    expect(sent.get(CATALOG_TOKEN_HEADER)).toBe("tok");
  });

  it("patches a product with the form body", async () => {
    const product = {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Rosa",
      description: "Una rosa",
      cost: 10.5,
      price: 20,
      type: "physical",
      weight: null,
      length: null,
      width: null,
      height: null,
      sku: null,
      bar_code: null,
      brand: null,
      visibility: "hidden",
      discount: null,
      family: null,
      size_ml: null,
      photos: ["products/rosa.png"],
      photo_urls: ["https://signed.example/rosa.png"],
      category_id: categoryId,
      tag_ids: [],
      created_at: "2026-09-28T12:00:00Z",
      updated_at: "2026-09-28T12:00:00Z",
    };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, product));
    const client = createCatalogClient("http://catalog.test", fetchImpl);
    const body = new FormData();
    body.set("visibility", "hidden");

    await expect(client.updateProduct(product.id, body, "tok")).resolves.toEqual({ ok: true, product });
    const call = fetchImpl.mock.calls[0];
    expect(call?.[0]).toBe(`http://catalog.test/products/${product.id}`);
    expect(call?.[1]?.method).toBe("PATCH");
    expect(call?.[1]?.body).toBe(body);
    const sent = new Headers(call?.[1]?.headers);
    expect(sent.get("Authorization")).toBe("Bearer tok");
    expect(sent.get(CATALOG_TOKEN_HEADER)).toBe("tok");
  });

  it("returns a generic detail when the network fails", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("down"));
    const client = createCatalogClient("http://catalog.test", fetchImpl);

    await expect(client.listProducts("tok")).resolves.toEqual({
      ok: false,
      status: 0,
      detail: UNAVAILABLE_DETAIL,
    });
  });
});
