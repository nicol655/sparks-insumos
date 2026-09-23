import { describe, expect, it } from "vitest";

import { catalogFor } from "@/fixtures/catalog";
import { createMockCatalogRepository } from "@/lib/api/mock-repository";
import {
  buildSearchSuggestions,
  SEARCH_SUGGESTION_LIMIT,
} from "@/lib/catalog/suggestions";

describe("buildSearchSuggestions", () => {
  it("returns note chips and brand chips from the catalogue, not invented copy", async () => {
    const products = catalogFor("es");
    const facets = await createMockCatalogRepository().getFacets("es");
    const suggestions = buildSearchSuggestions(facets, products);

    const notes = suggestions.filter((item) => item.kind === "note");
    const brands = suggestions.filter((item) => item.kind === "brand");
    const catalogNotes = new Set(
      products.flatMap((product) => [
        ...product.notes.top,
        ...product.notes.heart,
        ...product.notes.base,
      ]),
    );
    const catalogBrands = new Set(facets.brands.map((facet) => facet.value));

    expect(notes).toHaveLength(SEARCH_SUGGESTION_LIMIT);
    expect(brands).toHaveLength(SEARCH_SUGGESTION_LIMIT);
    expect(notes.every((item) => catalogNotes.has(item.value))).toBe(true);
    expect(brands.every((item) => catalogBrands.has(item.value))).toBe(true);
  });

  it("picks the notes that appear most often", () => {
    const suggestions = buildSearchSuggestions(
      { families: [], brands: [{ value: "Lattafa", count: 2 }], sizes: [], price: { min: 0, max: 1 } },
      [
        {
          id: "a",
          slug: "a",
          brand: "Lattafa",
          name: "A",
          family: "gourmand",
          concentration: "EdP",
          size: { ml: 100, label: "100 ml" },
          price: { amount: 1, currency: "ARS" },
          notes: { top: ["Vainilla"], heart: ["Rosa"], base: ["Oud"] },
          description: "x",
          stock: 1,
          images: { packshot: null, thumbnails: [], alt: "a bottle on a bone background" },
        },
        {
          id: "b",
          slug: "b",
          brand: "Lattafa",
          name: "B",
          family: "gourmand",
          concentration: "EdP",
          size: { ml: 100, label: "100 ml" },
          price: { amount: 1, currency: "ARS" },
          notes: { top: ["Vainilla"], heart: ["Rosa"], base: ["Ámbar"] },
          description: "x",
          stock: 1,
          images: { packshot: null, thumbnails: [], alt: "a bottle on a bone background" },
        },
      ],
    );

    expect(suggestions.filter((item) => item.kind === "note").map((item) => item.value)).toEqual([
      "Rosa",
      "Vainilla",
      "Ámbar",
    ]);
    expect(suggestions.filter((item) => item.kind === "brand").map((item) => item.value)).toEqual([
      "Lattafa",
    ]);
  });
});
