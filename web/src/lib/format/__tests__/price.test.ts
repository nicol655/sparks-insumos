import { describe, expect, it } from "vitest";

import { formatPrice } from "@/lib/format/price";

/** AC-4 — §06 of the design specification. */
describe("formatPrice", () => {
  it("formats the amount printed in the document", () => {
    expect(formatPrice(39000)).toBe("$39.000");
  });

  it("leaves no space between the symbol and the amount", () => {
    expect(formatPrice(39000)).not.toMatch(/\s/);
  });

  it("uses a dot as the thousands separator at every magnitude", () => {
    expect(formatPrice(1000)).toBe("$1.000");
    expect(formatPrice(1234567)).toBe("$1.234.567");
  });

  it("never shows decimals", () => {
    expect(formatPrice(39000.49)).toBe("$39.000");
    expect(formatPrice(39000.5)).toBe("$39.001");
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("$0");
  });

  it("keeps the amount in pesos when the interface is in English", () => {
    // The shop prices in ARS regardless of the reading language; only the
    // grouping convention follows the locale.
    expect(formatPrice(39000, "en")).toBe("ARS39,000");
  });

  it("rejects a non-finite amount instead of rendering NaN", () => {
    expect(() => formatPrice(Number.NaN)).toThrow(RangeError);
    expect(() => formatPrice(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
