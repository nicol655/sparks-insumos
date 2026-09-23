import { describe, expect, it } from "vitest";

import { catalogQuerySchema, type CatalogQuery } from "@/lib/api/contract";
import {
  catalogLink,
  catalogUrl,
  fromSearchParams,
  fromSearchValues,
  queryRecordFromSearchParams,
  toQueryRecord,
  toSearchParams,
} from "@/lib/catalog/search-params";

function query(overrides: Partial<CatalogQuery> = {}): CatalogQuery {
  return catalogQuerySchema.parse(overrides);
}

describe("catalogue search params", () => {
  it("round-trips a full query, including repeated facet keys", () => {
    const original = query({
      families: ["gourmand", "florales"],
      brands: ["Lattafa", "Afnan"],
      sizes: [50, 100],
      priceMin: 30000,
      priceMax: 50000,
      q: "vainilla",
      sort: "price-asc",
    });

    expect(fromSearchParams(toSearchParams(original))).toEqual(original);
  });

  it("omits the default sort so a bare /catalogo URL stays clean", () => {
    const params = toSearchParams(query());

    expect(params.toString()).toBe("");
    expect(fromSearchParams(params).sort).toBe("relevance");
  });

  it("treats several family values as a union after parsing", () => {
    const parsed = fromSearchParams(new URLSearchParams("family=gourmand&family=maderas"));

    expect(parsed.families).toEqual(["gourmand", "maderas"]);
  });

  it("drops an unknown sort instead of rejecting the rest of the query", () => {
    const parsed = fromSearchParams(new URLSearchParams("family=gourmand&sort=newest"));

    expect(parsed.families).toEqual(["gourmand"]);
    expect(parsed.sort).toBe("relevance");
  });

  it("ignores malformed sizes and negative prices", () => {
    const parsed = fromSearchParams(
      new URLSearchParams("size=100&size=nope&priceMin=-3&priceMax=40000"),
    );

    expect(parsed.sizes).toEqual([100]);
    expect(parsed.priceMin).toBeUndefined();
    expect(parsed.priceMax).toBe(40000);
  });

  it("reads Next.js searchParams objects, including array values", () => {
    const parsed = fromSearchValues({
      family: ["gourmand", "florales"],
      brand: "Kayali",
      sort: "name-asc",
    });

    expect(parsed.families).toEqual(["gourmand", "florales"]);
    expect(parsed.brands).toEqual(["Kayali"]);
    expect(parsed.sort).toBe("name-asc");
  });

  it("builds a query record that keeps repeated keys as arrays", () => {
    expect(toQueryRecord(query({ families: ["gourmand", "maderas"] }))).toEqual({
      family: ["gourmand", "maderas"],
    });
    expect(queryRecordFromSearchParams(new URLSearchParams("q=oud"))).toEqual({ q: "oud" });
  });

  it("builds a next-intl href and omits an empty query", () => {
    expect(catalogLink(query())).toEqual({ pathname: "/catalogo" });
    expect(catalogLink(query({ families: ["gourmand"] }))).toEqual({
      pathname: "/catalogo",
      query: { family: "gourmand" },
    });
  });

  it("builds a full catalogue URL for a native anchor", () => {
    expect(catalogUrl(query(), "es")).toBe("/es/catalogo");
    expect(catalogUrl(query({ families: ["gourmand"] }), "en")).toBe(
      "/en/catalogue?family=gourmand",
    );
  });
});
