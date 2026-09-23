import { describe, expect, it } from "vitest";

import { CART_MIN_SUBTOTAL, meetsCartMinimum } from "@/lib/cart/min-order";

describe("meetsCartMinimum", () => {
  it("opens checkout at $30.000 and not a peso less", () => {
    expect(CART_MIN_SUBTOTAL).toBe(30_000);
    expect(meetsCartMinimum(29_999)).toBe(false);
    expect(meetsCartMinimum(30_000)).toBe(true);
    expect(meetsCartMinimum(39_000)).toBe(true);
  });
});
