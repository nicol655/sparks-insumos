import { describe, expect, it } from "vitest";

import { catalogQuerySchema } from "@/lib/api/contract";
import { catalogFor } from "@/fixtures/catalog";
import { createMockCatalogRepository } from "@/lib/api/mock-repository";
import {
  activePriceBucket,
  hasActiveFilters,
  unavailableFacets,
  withClearedFilters,
  withPriceBucket,
  withToggledBrand,
  withToggledFamily,
} from "@/lib/catalog/query";

const empty = catalogQuerySchema.parse({});

describe("catalogue query helpers", () => {
  it("toggles a family on and off", () => {
    const on = withToggledFamily(empty, "gourmand");
    expect(on.families).toEqual(["gourmand"]);
    expect(withToggledFamily(on, "gourmand").families).toEqual([]);
  });

  it("treats a matching price bucket as active and clears it on a second toggle", () => {
    const ranged = withPriceBucket(empty, "mid");

    expect(ranged.priceMin).toBe(30_000);
    expect(ranged.priceMax).toBe(50_000);
    expect(activePriceBucket(ranged)).toBe("mid");
    expect(activePriceBucket(withPriceBucket(ranged, "mid"))).toBeNull();
  });

  it("clears facet state without touching sort", () => {
    const dirty = catalogQuerySchema.parse({
      families: ["gourmand"],
      brands: ["Lattafa"],
      sort: "price-desc",
    });

    expect(hasActiveFilters(dirty)).toBe(true);
    expect(withClearedFilters(dirty)).toEqual(catalogQuerySchema.parse({ sort: "price-desc" }));
  });

  it("dims brands that cannot combine with the current family (RF-2)", async () => {
    const products = catalogFor("es");
    const facets = await createMockCatalogRepository().getFacets("es");
    const query = withToggledFamily(empty, "gourmand");
    const unavailable = unavailableFacets(products, query, facets);

    expect(unavailable.brands).toContain("V.V Love");
    expect(unavailable.brands).not.toContain("Lattafa");
    expect(unavailable.families).toEqual([]);
  });

  it("never dims a chip that is already pressed, even on an empty combination", async () => {
    const products = catalogFor("es");
    const facets = await createMockCatalogRepository().getFacets("es");
    const query = withToggledBrand(withToggledFamily(empty, "gourmand"), "V.V Love");
    const unavailable = unavailableFacets(products, query, facets);

    expect(unavailable.families).not.toContain("gourmand");
    expect(unavailable.brands).not.toContain("V.V Love");
  });
});
