import { beforeEach, describe, expect, it, vi } from "vitest";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { forwardCart, forwardMe, resolveCartRequest } from "@/lib/cart/proxy";

vi.mock("@/lib/env", () => ({
  env: { API_MODE: "http", API_BASE_URL: "http://api:8000" },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  catalogRepository: () => ({
    getProduct: async () => null,
  }),
}));

const TOKEN = "opaque-token";
const PRODUCT = "22222222-2222-4222-8222-222222222222";

function cookieRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      cookie: `${SESSION_COOKIE}=${TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("forwardCart", () => {
  it("forwards POST with Bearer and returns upstream JSON status", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(
        {
          id: "33333333-3333-4333-8333-333333333333",
          user_id: "6b1e2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e",
          items: [{ product_id: PRODUCT, quantity: 2 }],
          created_at: "2026-09-25T12:00:00Z",
          updated_at: "2026-09-25T12:00:00Z",
        },
        { status: 201 },
      ),
    );

    const response = await forwardCart(
      cookieRequest("http://web.local/api/cart", {
        method: "POST",
        body: JSON.stringify({ items: [{ product_id: PRODUCT, quantity: 2 }] }),
      }),
      fetchImpl,
    );

    expect(response.status).toBe(201);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://api:8000/carts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      items: [{ product_id: PRODUCT, quantity: 2 }],
    });
  });

  it("returns 401 without a session cookie", async () => {
    const response = await forwardCart(
      new Request("http://web.local/api/cart", {
        method: "DELETE",
        headers: { Accept: "application/json" },
      }),
      vi.fn(),
    );
    expect(response.status).toBe(401);
  });
});

describe("forwardMe", () => {
  it("returns signedIn false when there is no cookie", async () => {
    const response = await forwardMe(new Request("http://web.local/api/me"), vi.fn());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, signedIn: false });
  });
});

describe("resolveCartRequest", () => {
  it("returns JSON lines payload", async () => {
    const response = await resolveCartRequest(
      new Request("http://web.local/api/cart/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: PRODUCT, slug: PRODUCT, quantity: 1 }],
          locale: "es",
        }),
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      lines: [],
      unavailable: [{ productId: PRODUCT }],
      count: 0,
    });
  });
});
