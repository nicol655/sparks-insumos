import { describe, expect, it } from "vitest";

import { catalogFor } from "@/fixtures/catalog";
import {
  cartWriteAfterAdd,
  planAfterClear,
  planAfterRemove,
  planAfterSetQuantity,
} from "@/lib/cart/write";

const king = catalogFor("es").find((product) => product.slug === "bharara-king")!;
const yara = catalogFor("es").find((product) => product.slug === "lattafa-yara")!;
const soldOut = catalogFor("es").find((product) => product.slug === "paris-corner-emir-ironwood")!;

const twoLines = [
  { productId: king.id, slug: king.slug, quantity: 2 },
  { productId: yara.id, slug: yara.slug, quantity: 1 },
];

describe("cartWriteAfterAdd", () => {
  it("starts a cart with the added line", () => {
    expect(cartWriteAfterAdd([], king, 2)).toEqual({
      items: [{ product_id: king.id, quantity: 2 }],
    });
  });

  it("increments an existing line", () => {
    expect(
      cartWriteAfterAdd([{ productId: king.id, slug: king.slug, quantity: 1 }], king, 2),
    ).toEqual({
      items: [{ product_id: king.id, quantity: 3 }],
    });
  });

  it("returns null for a sold-out product", () => {
    expect(cartWriteAfterAdd([], soldOut, 1)).toBeNull();
  });
});

describe("planAfterSetQuantity / remove / clear", () => {
  it("replaces quantity on PUT", () => {
    expect(planAfterSetQuantity(twoLines, king.id, 5)).toEqual({
      action: "replace",
      body: {
        items: [
          { product_id: king.id, quantity: 5 },
          { product_id: yara.id, quantity: 1 },
        ],
      },
    });
  });

  it("deletes when quantity drops the last line", () => {
    expect(
      planAfterSetQuantity([{ productId: king.id, slug: king.slug, quantity: 1 }], king.id, 0),
    ).toEqual({ action: "delete" });
  });

  it("deletes when removing the only line", () => {
    expect(planAfterRemove([{ productId: king.id, slug: king.slug, quantity: 2 }], king.id)).toEqual({
      action: "delete",
    });
  });

  it("replaces when removing one of several lines", () => {
    expect(planAfterRemove(twoLines, king.id)).toEqual({
      action: "replace",
      body: { items: [{ product_id: yara.id, quantity: 1 }] },
    });
  });

  it("clears with delete when there are items", () => {
    expect(planAfterClear(twoLines)).toEqual({ action: "delete" });
    expect(planAfterClear([])).toBeNull();
  });
});
