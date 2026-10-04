import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { env } from "@/lib/env";
import { createCatalogHandlers, forwardCatalog, forwardProductPatch, type CatalogPath } from "@/lib/catalog/proxy";
import { CATALOG_TOKEN_HEADER } from "@/lib/catalog/token-header";

const fetchImpl = vi.fn<typeof fetch>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("catalog proxy", () => {
  it("does not call the API without a bearer", async () => {
    fetchImpl.mockReset();
    const response = await forwardCatalog(new Request("http://panel.local/api/catalog/products"), "/products", fetchImpl);

    expect(response.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forwards GET and POST only to the fixed catalog paths", async () => {
    fetchImpl.mockReset();
    fetchImpl.mockImplementation(async () => json([]));
    const response = await forwardCatalog(
      new Request("http://panel.local/api/catalog/products?limit=50", {
        headers: { Authorization: "Bearer tok" },
      }),
      "/products",
      fetchImpl,
    );

    expect(response.status).toBe(200);
    const getCall = fetchImpl.mock.calls[0];
    expect(getCall?.[0]).toBe(`${env.API_BASE_URL}/products?limit=50`);
    expect(getCall?.[1]?.method).toBe("GET");
    expect(new Headers(getCall?.[1]?.headers).get("Authorization")).toBe("Bearer tok");

    fetchImpl.mockImplementation(async () => json({ id: "x" }, 201));
    await forwardCatalog(
      new Request("http://panel.local/api/catalog/products", {
        method: "POST",
        headers: {
          Authorization: "Bearer tok",
          "Content-Type": "multipart/form-data; boundary=sparks",
        },
        body: "--sparks\r\nname\r\n--sparks--",
      }),
      "/products",
      fetchImpl,
    );

    const post = fetchImpl.mock.calls[1];
    expect(post?.[0]).toBe(`${env.API_BASE_URL}/products`);
    expect(post?.[1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({ "Content-Type": "multipart/form-data; boundary=sparks" }),
    });
    const body = post?.[1]?.body;
    expect(new TextDecoder().decode(body as ArrayBuffer)).toContain("name");

    const tags = createCatalogHandlers("/tags", fetchImpl);
    await tags.GET(new Request("http://panel.local/api/catalog/tags", { headers: { Authorization: "Bearer tok" } }));
    expect(fetchImpl.mock.calls[2]?.[0]).toBe(`${env.API_BASE_URL}/tags`);
  });

  it("uses the panel token header when Authorization is missing", async () => {
    fetchImpl.mockReset();
    fetchImpl.mockImplementation(async () => json([]));
    const response = await forwardCatalog(
      new Request("http://panel.local/api/catalog/products", {
        headers: { [CATALOG_TOKEN_HEADER]: "tok" },
      }),
      "/products",
      fetchImpl,
    );

    expect(response.status).toBe(200);
    const headers = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer tok");
    expect(headers.has(CATALOG_TOKEN_HEADER)).toBe(false);
  });

  it("rejects a path outside the catalog", async () => {
    fetchImpl.mockReset();
    const response = await forwardCatalog(
      new Request("http://panel.local/audits", { headers: { Authorization: "Bearer tok" } }),
      "/audits" as CatalogPath,
      fetchImpl,
    );

    expect(response.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forwards a product patch and rejects an id that is not a uuid", async () => {
    fetchImpl.mockReset();
    fetchImpl.mockImplementation(async () => json({ id: "ok" }));
    const id = "22222222-2222-4222-8222-222222222222";
    const response = await forwardProductPatch(
      new Request(`http://panel.local/api/catalog/products/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer tok",
          "Content-Type": "multipart/form-data; boundary=sparks",
        },
        body: "--sparks\r\nvisibility\r\n--sparks--",
      }),
      id,
      fetchImpl,
    );

    expect(response.status).toBe(200);
    const call = fetchImpl.mock.calls[0];
    expect(call?.[0]).toBe(`${env.API_BASE_URL}/products/${id}`);
    expect(call?.[1]).toMatchObject({
      method: "PATCH",
      headers: expect.objectContaining({ "Content-Type": "multipart/form-data; boundary=sparks" }),
    });
    expect(new TextDecoder().decode(call?.[1]?.body as ArrayBuffer)).toContain("visibility");

    fetchImpl.mockClear();
    const missing = await forwardProductPatch(
      new Request("http://panel.local/api/catalog/products/nope", {
        method: "PATCH",
        headers: { Authorization: "Bearer tok" },
      }),
      "nope",
      fetchImpl,
    );
    expect(missing.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("only has the three catalog route folders", async () => {
    const catalogDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../app/api/catalog");
    const names = (await readdir(catalogDir)).sort();
    expect(names).toEqual(["product-categories", "products", "tags"]);
  });
});
