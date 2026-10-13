import { beforeEach, describe, expect, it, vi } from "vitest";

import { catalogFor } from "@/fixtures/catalog";
import type { Cart } from "@/lib/auth/contract";
import { useCartStore } from "@/lib/cart/store";
import { useCartMutations } from "@/lib/cart/use-cart-mutations";
import { renderHookWithIntl } from "@/test/i18n";

const king = catalogFor("es").find((product) => product.slug === "bharara-king")!;
const yara = catalogFor("es").find((product) => product.slug === "lattafa-yara")!;

const CART: Cart = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: "6b1e2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e",
  items: [{ product_id: king.id, quantity: 3 }],
  created_at: "2026-09-25T12:00:00Z",
  updated_at: "2026-09-25T12:00:00Z",
};

vi.mock("@/lib/cart/browser", () => ({
  replaceCart: vi.fn(),
  deleteCart: vi.fn(),
}));

beforeEach(() => {
  useCartStore.setState({
    items: [
      { productId: king.id, slug: king.slug, quantity: 2 },
      { productId: yara.id, slug: yara.slug, quantity: 1 },
    ],
    cartId: CART.id,
    hydrated: true,
    serverReady: true,
  });
});

describe("useCartMutations", () => {
  it("keeps guest quantity and remove local", async () => {
    const { result } = renderHookWithIntl(() =>
      useCartMutations({
        isSignedIn: () => false,
        replaceCart: vi.fn(),
        deleteCart: vi.fn(),
      }),
    );

    await result.current.setQuantity(king.id, 4);
    expect(useCartStore.getState().items[0]?.quantity).toBe(4);

    await result.current.remove(yara.id);
    expect(useCartStore.getState().items.map((item) => item.productId)).toEqual([king.id]);
  });

  it("PUTs an updated quantity when signed in", async () => {
    const replaceCart = vi.fn(async () => ({
      ok: true as const,
      cart: { ...CART, items: [{ product_id: king.id, quantity: 5 }, { product_id: yara.id, quantity: 1 }] },
    }));
    const deleteCart = vi.fn();
    const { result } = renderHookWithIntl(() =>
      useCartMutations({ isSignedIn: () => true, replaceCart, deleteCart }),
    );

    await result.current.setQuantity(king.id, 5);

    expect(replaceCart).toHaveBeenCalledWith({
      items: [
        { product_id: king.id, quantity: 5 },
        { product_id: yara.id, quantity: 1 },
      ],
    });
    expect(deleteCart).not.toHaveBeenCalled();
    expect(useCartStore.getState().items[0]?.quantity).toBe(5);
  });

  it("DELETEs when the last line is removed", async () => {
    useCartStore.setState({
      items: [{ productId: king.id, slug: king.slug, quantity: 1 }],
      cartId: CART.id,
    });
    const replaceCart = vi.fn();
    const deleteCart = vi.fn(async () => ({ ok: true as const }));
    const { result } = renderHookWithIntl(() =>
      useCartMutations({ isSignedIn: () => true, replaceCart, deleteCart }),
    );

    await result.current.remove(king.id);

    expect(deleteCart).toHaveBeenCalledOnce();
    expect(replaceCart).not.toHaveBeenCalled();
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().cartId).toBeNull();
  });

  it("clear DELETEs the signed-in cart", async () => {
    const deleteCart = vi.fn(async () => ({ ok: true as const }));
    const { result } = renderHookWithIntl(() =>
      useCartMutations({ isSignedIn: () => true, replaceCart: vi.fn(), deleteCart }),
    );

    await result.current.clear();

    expect(deleteCart).toHaveBeenCalledOnce();
    expect(useCartStore.getState().items).toEqual([]);
  });
});
