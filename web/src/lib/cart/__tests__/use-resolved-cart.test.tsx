import { beforeEach, describe, expect, it, vi } from "vitest";

import { catalogFor } from "@/fixtures/catalog";
import { resolveCart, useCartStore } from "@/lib/cart/store";
import { useResolvedCart } from "@/lib/cart/use-resolved-cart";
import { createMockCatalogRepository } from "@/lib/api/mock-repository";
import { renderHookWithIntl } from "@/test/i18n";
import { waitFor } from "@testing-library/react";

const king = catalogFor("es").find((product) => product.slug === "bharara-king")!;

beforeEach(() => {
  useCartStore.setState({ items: [], hydrated: true, serverReady: true });
});

describe("useResolvedCart", () => {
  it("resolves lines through the injected join (server-action shaped)", async () => {
    useCartStore.setState({
      items: [{ productId: king.id, slug: king.slug, quantity: 2 }],
    });
    const resolve = vi.fn(async (items, locale) =>
      resolveCart(items, createMockCatalogRepository(), locale),
    );

    const { result } = renderHookWithIntl(() => useResolvedCart({ resolve }));

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    expect(resolve).toHaveBeenCalledOnce();
    expect(result.current.cart.lines).toHaveLength(1);
    expect(result.current.cart.lines[0]?.product.name).toBe("King");
    expect(result.current.cart.count).toBe(2);
  });
});
