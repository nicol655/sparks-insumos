import { beforeEach, describe, expect, it, vi } from "vitest";

import { SIGNED_IN_COOKIE } from "@/lib/auth/session";
import { hydrateCartSession } from "@/lib/cart/hydrate-session";
import { useCartStore } from "@/lib/cart/store";

const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";
const CART_ID = "33333333-3333-4333-8333-333333333333";
const USER_ID = "6b1e2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e";
const TIMESTAMP = "2026-09-25T12:00:00Z";

beforeEach(() => {
  document.cookie = `${SIGNED_IN_COOKIE}=; Max-Age=0`;
  localStorage.clear();
  useCartStore.setState({
    items: [],
    cartId: null,
    hydrated: false,
    serverReady: false,
  });
});

describe("hydrateCartSession", () => {
  it("rehydrates localStorage when the shopper is signed out", async () => {
    localStorage.setItem(
      "sparks.cart",
      JSON.stringify({
        version: 1,
        state: { items: [{ productId: "prd-001", slug: "bharara-king", quantity: 2 }] },
      }),
    );
    const load = vi.fn();

    await hydrateCartSession(load);

    expect(load).not.toHaveBeenCalled();
    expect(useCartStore.getState().hydrated).toBe(true);
    expect(useCartStore.getState().serverReady).toBe(false);
    expect(useCartStore.getState().items).toEqual([
      { productId: "prd-001", slug: "bharara-king", quantity: 2 },
    ]);
  });

  it("applies the server cart when signed in", async () => {
    document.cookie = `${SIGNED_IN_COOKIE}=1`;
    const load = vi.fn(async () => ({
      ok: true as const,
      signedIn: true as const,
      cart: {
        id: CART_ID,
        user_id: USER_ID,
        items: [{ product_id: PRODUCT_ID, quantity: 5 }],
        created_at: TIMESTAMP,
        updated_at: TIMESTAMP,
      },
    }));

    await hydrateCartSession(load);

    expect(load).toHaveBeenCalledOnce();
    const state = useCartStore.getState();
    expect(state.serverReady).toBe(true);
    expect(state.cartId).toBe(CART_ID);
    expect(state.items).toEqual([{ productId: PRODUCT_ID, slug: PRODUCT_ID, quantity: 5 }]);
  });

  it("refetches /me even when serverReady is already set", async () => {
    document.cookie = `${SIGNED_IN_COOKIE}=1`;
    useCartStore.setState({
      serverReady: true,
      hydrated: true,
      cartId: CART_ID,
      items: [{ productId: PRODUCT_ID, slug: PRODUCT_ID, quantity: 1 }],
    });
    const load = vi.fn(async () => ({
      ok: true as const,
      signedIn: true as const,
      cart: {
        id: CART_ID,
        user_id: USER_ID,
        items: [{ product_id: PRODUCT_ID, quantity: 5 }],
        created_at: TIMESTAMP,
        updated_at: TIMESTAMP,
      },
    }));

    await hydrateCartSession(load);

    expect(load).toHaveBeenCalledOnce();
    expect(useCartStore.getState().items).toEqual([
      { productId: PRODUCT_ID, slug: PRODUCT_ID, quantity: 5 },
    ]);
  });

  it("falls back to local rehydrate after an unauthorized session", async () => {
    document.cookie = `${SIGNED_IN_COOKIE}=1`;
    const load = vi.fn(async () => ({ ok: false as const, code: "unauthorized" as const }));

    await hydrateCartSession(load);

    expect(useCartStore.getState().hydrated).toBe(true);
    expect(useCartStore.getState().serverReady).toBe(false);
  });

  it("clears serverReady and rehydrates local after sign-out", async () => {
    useCartStore.setState({
      serverReady: true,
      cartId: "33333333-3333-4333-8333-333333333333",
      items: [{ productId: PRODUCT_ID, slug: PRODUCT_ID, quantity: 1 }],
      hydrated: true,
    });
    const load = vi.fn();

    await hydrateCartSession(load);

    expect(load).not.toHaveBeenCalled();
    expect(useCartStore.getState().serverReady).toBe(false);
    expect(useCartStore.getState().cartId).toBeNull();
    expect(useCartStore.getState().hydrated).toBe(true);
  });
});
