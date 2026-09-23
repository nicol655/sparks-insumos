import { describe, expect, it } from "vitest";

import { catalogFor, OLFACTIVE_FAMILIES } from "@/fixtures/catalog";
import { LOCALES } from "@/i18n/locales";
import { productSchema } from "@/lib/api/contract";

/**
 * The fixtures stand in for the backend, so they have to satisfy the contract
 * exactly — otherwise the mock adapter would let through data the real service
 * could never send.
 */
describe.each(LOCALES)("catalog fixtures · %s", (locale) => {
  const catalog = catalogFor(locale);

  it("satisfies the product contract", () => {
    for (const product of catalog) {
      expect(() => productSchema.parse(product)).not.toThrow();
    }
  });

  it("has unique ids and slugs", () => {
    expect(new Set(catalog.map((product) => product.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map((product) => product.slug)).size).toBe(catalog.length);
  });

  it("only uses the four families shown in the prototype", () => {
    for (const product of catalog) {
      expect(OLFACTIVE_FAMILIES).toContain(product.family);
    }
  });

  it("covers every family, so the home grid is never empty", () => {
    const present = new Set(catalog.map((product) => product.family));

    expect([...OLFACTIVE_FAMILIES].every((family) => present.has(family))).toBe(true);
  });

  it("includes a sold-out product so the out-of-stock state stays exercised", () => {
    expect(catalog.some((product) => product.stock === 0)).toBe(true);
  });

  it("has no photography yet, so every card falls back to the §05 placeholder", () => {
    for (const product of catalog) {
      expect(product.images.packshot).toBeNull();
      expect(product.images.alt.length).toBeGreaterThan(10);
    }
  });

  it("prices whole pesos, as §06 requires", () => {
    for (const product of catalog) {
      expect(Number.isInteger(product.price.amount)).toBe(true);
      expect(product.price.currency).toBe("ARS");
    }
  });
});

describe("catalog fixtures · translation", () => {
  it("translates description and notes without touching brand or name", () => {
    const es = catalogFor("es");
    const en = catalogFor("en");

    expect(es).toHaveLength(en.length);

    es.forEach((product, index) => {
      const translated = en[index];

      expect(translated?.slug).toBe(product.slug);
      expect(translated?.brand).toBe(product.brand);
      expect(translated?.name).toBe(product.name);
      expect(translated?.description).not.toBe(product.description);
    });
  });
});
