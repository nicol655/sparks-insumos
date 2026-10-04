// @vitest-environment node

import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createCatalogClient } from "@/lib/catalog/client";
import type { ProductWrite } from "@/lib/catalog/form";
import { INVALID_DETAIL } from "@/lib/catalog/labels";

const categoryId = "11111111-1111-4111-8111-111111111111";
const tagId = "33333333-3333-4333-8333-333333333333";
const productId = "22222222-2222-4222-8222-222222222222";

let server: Server;
let base = "";
let lastAuthorization = "";
let lastRaw = "";
let stored: Record<string, unknown> | null = null;

function readFields(raw: string, field: string): string[] {
  const values: string[] = [];
  const needle = `name="${field}"`;
  let from = 0;
  while (from < raw.length) {
    const start = raw.indexOf(needle, from);
    if (start < 0) break;
    const headerEnd = raw.indexOf("\r\n\r\n", start);
    if (headerEnd < 0) break;
    const valueStart = headerEnd + 4;
    const valueEnd = raw.indexOf("\r\n--", valueStart);
    if (valueEnd < 0) break;
    values.push(raw.slice(valueStart, valueEnd));
    from = valueEnd + 4;
  }
  return values;
}

function readField(raw: string, field: string): string | null {
  return readFields(raw, field)[0] ?? null;
}

function send(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function productFrom(raw: string): Record<string, unknown> {
  const numberOrNull = (field: string) => {
    const value = readField(raw, field);
    return value ? Number(value) : null;
  };
  const textOrNull = (field: string) => readField(raw, field);
  return {
    id: productId,
    name: readField(raw, "name"),
    description: readField(raw, "description") ?? "",
    cost: Number(readField(raw, "cost")),
    price: Number(readField(raw, "price")),
    type: readField(raw, "type"),
    weight: numberOrNull("weight"),
    length: numberOrNull("length"),
    width: numberOrNull("width"),
    height: numberOrNull("height"),
    sku: textOrNull("sku"),
    bar_code: textOrNull("bar_code"),
    brand: textOrNull("brand"),
    visibility: readField(raw, "visibility"),
    discount: numberOrNull("discount"),
    family: textOrNull("family"),
    size_ml: numberOrNull("size_ml"),
    photos: ["products/rosa.png"],
    photo_urls: ["https://signed.example/rosa.png"],
    category_id: readField(raw, "category_id"),
    tag_ids: readFields(raw, "tag_ids"),
    created_at: "2026-09-28T12:00:00Z",
    updated_at: "2026-09-28T12:00:00Z",
  };
}

function handle(request: IncomingMessage, response: ServerResponse) {
  const chunks: Buffer[] = [];
  request.on("data", (chunk: Buffer) => chunks.push(chunk));
  request.on("end", () => {
    const raw = Buffer.concat(chunks).toString("latin1");
    lastAuthorization = request.headers.authorization ?? "";
    lastRaw = raw;
    const url = request.url ?? "/";

    if (!lastAuthorization.startsWith("Bearer ")) {
      send(response, 401, { code: "not_authenticated", detail: "Tenés que iniciar sesión." });
      return;
    }

    if (request.method === "GET" && url === "/products") {
      send(response, 200, stored ? [stored] : []);
      return;
    }

    if (request.method === "POST" && url === "/products") {
      const name = readField(raw, "name");
      if (!name?.trim()) {
        send(response, 422, { detail: [{ loc: ["body", "name"], msg: "Field required" }] });
        return;
      }
      stored = productFrom(raw);
      send(response, 201, stored);
      return;
    }

    send(response, 404, { detail: "No existe esa ruta." });
  });
}

const photo = new File([Uint8Array.from([137, 80, 78, 71])], "rosa.png", { type: "image/png" });

function input(name: string): ProductWrite {
  return {
    name,
    description: "Una rosa",
    cost: "10.50",
    price: "20.00",
    type: "physical",
    visibility: "visible",
    categoryId,
    photos: [photo],
    brand: "Sparks",
    family: "florales",
    sizeMl: "100",
    tagIds: [tagId],
  };
}

describe("catalog client over loopback", () => {
  beforeAll(async () => {
    server = createServer(handle);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("no port");
    base = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("sends the bearer and the multipart, then lists the created product", async () => {
    const client = createCatalogClient(base);
    const created = await client.createProduct(input("Rosa"), "secret");

    expect(created.ok).toBe(true);
    expect(lastAuthorization).toBe("Bearer secret");
    expect(lastRaw).toContain('filename="rosa.png"');
    expect(lastRaw).toContain('name="description"');
    expect(lastRaw).toContain('name="cost"');
    expect(lastRaw).toContain('name="price"');
    expect(lastRaw).toContain('name="type"');
    expect(lastRaw).toContain('name="visibility"');
    expect(lastRaw).toContain('name="category_id"');
    expect(lastRaw).toContain('name="brand"');
    expect(lastRaw).toContain('name="tag_ids"');
    expect(lastRaw).not.toContain('name="weight"');

    const listed = await client.listProducts("secret");
    expect(listed.ok).toBe(true);
    if (listed.ok && created.ok) {
      expect(listed.products.map((item) => item.name)).toContain("Rosa");
      expect(created.product.brand).toBe("Sparks");
      expect(created.product.cost).toBe(10.5);
    }
  });

  it("reads a create without a name as 422", async () => {
    const client = createCatalogClient(base);
    const result = await client.createProduct(input(""), "secret");

    expect(result).toEqual({ ok: false, status: 422, detail: INVALID_DETAIL });
  });
});
