import { beforeEach, describe, expect, it } from "vitest";

import { catalogFor } from "@/fixtures/catalog";
import type { Product } from "@/lib/api/contract";
import { createMockCatalogRepository } from "@/lib/api/mock-repository";
import {
  cartCount,
  rehydrateCart,
  resolveCart,
  useCartStore,
  type CartItem,
} from "@/lib/cart/store";

const catalog = catalogFor("es");
const repository = createMockCatalogRepository();

function bySlug(slug: string): Product {
  const product = catalog.find((item) => item.slug === slug);
  if (!product) throw new Error(`Fixture ${slug} is missing`);

  return product;
}

const king = bySlug("bharara-king"); // 39000, stock 7
const yara = bySlug("lattafa-yara"); // 21000, stock 18
const soldOut = bySlug("paris-corner-emir-ironwood"); // stock 0
const scarce = bySlug("rasasi-la-yuqawam"); // 62000, stock 1

const cart = () => useCartStore.getState();

function seedStorage(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state: { items } }));
}

const STORAGE_KEY = "sparks.cart";

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [], hydrated: false });
});

/** RF-5, AC-14 to AC-16. */
describe("cart store", () => {
  it("starts empty", () => {
    expect(cart().items).toEqual([]);
    expect(cartCount(cart().items)).toBe(0);
  });

  it("stores a reference, never a price", () => {
    cart().add(king);

    expect(cart().items).toEqual([{ productId: king.id, slug: "bharara-king", quantity: 1 }]);
  });

  it("increments instead of duplicating the line", () => {
    cart().add(king);
    cart().add(king, 2);

    expect(cart().items).toHaveLength(1);
    expect(cartCount(cart().items)).toBe(3);
  });

  it("keeps separate lines per product", () => {
    cart().add(king);
    cart().add(yara, 2);

    expect(cart().items.map((item) => item.slug)).toEqual(["bharara-king", "lattafa-yara"]);
    expect(cartCount(cart().items)).toBe(3);
  });

  it("refuses a sold-out product", () => {
    cart().add(soldOut);

    expect(cart().items).toEqual([]);
  });

  it("never adds beyond available stock", () => {
    cart().add(scarce, 5);
    expect(cartCount(cart().items)).toBe(1);

    cart().add(king, 99);
    expect(cart().items.find((item) => item.slug === "bharara-king")?.quantity).toBe(7);
  });

  it("removes the line when the quantity drops to zero", () => {
    cart().add(king);
    cart().add(yara);
    cart().setQuantity(king.id, 0);

    expect(cart().items.map((item) => item.slug)).toEqual(["lattafa-yara"]);
  });

  it("keeps the quantity at one or above", () => {
    cart().add(king, 3);
    cart().setQuantity(king.id, -2);

    expect(cart().items).toEqual([]);
  });

  it("ignores a quantity change for a product that is not in the cart", () => {
    cart().add(king);
    cart().setQuantity("prd-999", 4);

    expect(cart().items).toHaveLength(1);
  });

  it("truncates a fractional quantity", () => {
    cart().add(king);
    cart().setQuantity(king.id, 2.7);

    expect(cart().items[0]?.quantity).toBe(2);
  });

  it("removes and clears", () => {
    cart().add(king);
    cart().add(yara);

    cart().remove(king.id);
    expect(cart().items).toHaveLength(1);

    cart().clear();
    expect(cart().items).toEqual([]);
  });
});

/** AC-15: the cart survives a reload and a language switch. */
describe("cart persistence", () => {
  it("writes only product references to storage", () => {
    cart().add(king, 2);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");

    expect(stored.version).toBe(1);
    expect(Object.keys(stored.state)).toEqual(["items"]);
    expect(stored.state.items).toEqual([
      { productId: king.id, slug: "bharara-king", quantity: 2 },
    ]);
    expect(JSON.stringify(stored)).not.toContain("39000");
  });

  it("reads back a cart left by a previous session", async () => {
    // Seeded straight into storage: persist writes on every state change, so
    // emptying the store first would erase what we are trying to read back.
    seedStorage([{ productId: king.id, slug: king.slug, quantity: 3 }]);

    await rehydrateCart();

    expect(cartCount(cart().items)).toBe(3);
    expect(cart().hydrated).toBe(true);
  });

  it("discards a tampered cart instead of loading it half-way", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, state: { items: [{ productId: "", quantity: -4 }] } }),
    );

    await rehydrateCart();

    expect(cart().items).toEqual([]);
  });

  it("collapses duplicate references written by an older client", async () => {
    seedStorage([
      { productId: king.id, slug: king.slug, quantity: 2 },
      { productId: king.id, slug: king.slug, quantity: 3 },
    ]);

    await rehydrateCart();

    expect(cart().items).toEqual([{ productId: king.id, slug: king.slug, quantity: 5 }]);
  });
});

/** The price a shopper sees always comes from the repository, never storage. */
describe("resolveCart", () => {
  it("joins references with current product data", async () => {
    cart().add(king, 2);
    cart().add(yara);

    const resolved = await resolveCart(cart().items, repository, "es");

    expect(resolved.count).toBe(3);
    expect(resolved.subtotal).toBe(2 * 39000 + 21000);
    expect(resolved.lines[0]?.unitPrice).toBe(39000);
    expect(resolved.lines[0]?.lineTotal).toBe(78000);
    expect(resolved.unavailable).toEqual([]);
  });

  it("uses today's price even when the reference is old", async () => {
    seedStorage([{ productId: king.id, slug: king.slug, quantity: 1 }]);
    await rehydrateCart();

    const resolved = await resolveCart(cart().items, repository, "es");

    expect(resolved.subtotal).toBe(39000);
  });

  it("reports a product that no longer exists instead of dropping it silently", async () => {
    const resolved = await resolveCart(
      [{ productId: "prd-999", slug: "descatalogado", quantity: 1 }],
      repository,
      "es",
    );

    expect(resolved.lines).toEqual([]);
    expect(resolved.unavailable).toHaveLength(1);
    expect(resolved.subtotal).toBe(0);
  });

  it("reports a product that sold out since it was added", async () => {
    seedStorage([{ productId: soldOut.id, slug: soldOut.slug, quantity: 1 }]);
    await rehydrateCart();

    const resolved = await resolveCart(cart().items, repository, "es");

    expect(resolved.lines).toEqual([]);
    expect(resolved.unavailable.map((item) => item.slug)).toEqual([soldOut.slug]);
  });

  it("clamps a stored quantity that now exceeds stock", async () => {
    seedStorage([{ productId: scarce.id, slug: scarce.slug, quantity: 6 }]);
    await rehydrateCart();

    const resolved = await resolveCart(cart().items, repository, "es");

    expect(resolved.lines[0]?.quantity).toBe(1);
    expect(resolved.subtotal).toBe(62000);
  });

  it("resolves localized product copy without changing the stored cart", async () => {
    cart().add(king);
    const stored = cart().items;

    const en = await resolveCart(stored, repository, "en");

    expect(en.lines[0]?.product.notes.base).toContain("Musk");
    expect(cart().items).toEqual(stored);
  });
});
