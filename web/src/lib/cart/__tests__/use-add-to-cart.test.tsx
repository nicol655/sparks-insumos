import { beforeEach, describe, expect, it, vi } from "vitest";

import { catalogFor } from "@/fixtures/catalog";
import type { Cart } from "@/lib/auth/contract";
import { useCartStore } from "@/lib/cart/store";
import { useAddToCart } from "@/lib/cart/use-add-to-cart";
import { useUiStore } from "@/lib/ui/store";
import { renderHookWithIntl } from "@/test/i18n";

const king = catalogFor("es").find((product) => product.slug === "bharara-king")!;

const CART: Cart = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: "6b1e2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e",
  items: [{ product_id: king.id, quantity: 2 }],
  created_at: "2026-09-25T12:00:00Z",
  updated_at: "2026-09-25T12:00:00Z",
};

vi.mock("@/lib/cart/browser", () => ({
  createCart: vi.fn(),
  replaceCart: vi.fn(),
}));

beforeEach(() => {
  useCartStore.setState({ items: [], cartId: null, hydrated: true, serverReady: true });
  useUiStore.setState({ overlay: null, toasts: [] });
});

describe("useAddToCart", () => {
  it("keeps the guest path local", async () => {
    const { result } = renderHookWithIntl(() =>
      useAddToCart({
        isSignedIn: () => false,
        createCart: vi.fn(),
        replaceCart: vi.fn(),
      }),
    );

    await result.current(king, 2);

    expect(useCartStore.getState().items).toEqual([
      { productId: king.id, slug: king.slug, quantity: 2 },
    ]);
    expect(useUiStore.getState().overlay).toBe("cart");
    expect(useUiStore.getState().toasts).toHaveLength(1);
  });

  it("POSTs when the signed-in shopper has no cart yet", async () => {
    const createCart = vi.fn(async () => ({ ok: true as const, cart: CART }));
    const replaceCart = vi.fn();
    const { result } = renderHookWithIntl(() =>
      useAddToCart({ isSignedIn: () => true, createCart, replaceCart }),
    );

    await result.current(king, 2);

    expect(createCart).toHaveBeenCalledWith({ items: [{ product_id: king.id, quantity: 2 }] });
    expect(replaceCart).not.toHaveBeenCalled();
    expect(useCartStore.getState().cartId).toBe(CART.id);
    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
    expect(useUiStore.getState().overlay).toBe("cart");
  });

  it("PUTs when a server cart already exists", async () => {
    useCartStore.setState({ cartId: CART.id, items: [{ productId: king.id, slug: king.slug, quantity: 1 }] });
    const replaced = { ...CART, items: [{ product_id: king.id, quantity: 3 }] };
    const createCart = vi.fn();
    const replaceCart = vi.fn(async () => ({ ok: true as const, cart: replaced }));
    const { result } = renderHookWithIntl(() =>
      useAddToCart({ isSignedIn: () => true, createCart, replaceCart }),
    );

    await result.current(king, 2);

    expect(replaceCart).toHaveBeenCalledWith({ items: [{ product_id: king.id, quantity: 3 }] });
    expect(createCart).not.toHaveBeenCalled();
    expect(useCartStore.getState().items[0]?.quantity).toBe(3);
  });

  it("falls back to PUT when create conflicts", async () => {
    const createCart = vi.fn(async () => ({ ok: false as const, code: "conflict" as const }));
    const replaceCart = vi.fn(async () => ({ ok: true as const, cart: CART }));
    const { result } = renderHookWithIntl(() =>
      useAddToCart({ isSignedIn: () => true, createCart, replaceCart }),
    );

    await result.current(king, 2);

    expect(createCart).toHaveBeenCalledOnce();
    expect(replaceCart).toHaveBeenCalledOnce();
    expect(useCartStore.getState().cartId).toBe(CART.id);
  });

  it("toasts when the signed-in mutate call fails", async () => {
    const createCart = vi.fn(async () => ({ ok: false as const, code: "unavailable" as const }));
    const { result } = renderHookWithIntl(() =>
      useAddToCart({ isSignedIn: () => true, createCart, replaceCart: vi.fn() }),
    );

    await result.current(king, 1);

    expect(useUiStore.getState().overlay).toBeNull();
    expect(useUiStore.getState().toasts).toHaveLength(1);
    expect(useCartStore.getState().items).toEqual([]);
  });
});
