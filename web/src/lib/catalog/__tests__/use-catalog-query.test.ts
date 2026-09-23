import { describe, expect, it } from "vitest";

import { catalogHref } from "@/lib/catalog/use-catalog-query";
import { catalogQuerySchema } from "@/lib/api/contract";

describe("catalogHref", () => {
  it("keeps the locale-prefixed path and appends the query", () => {
    expect(catalogHref(catalogQuerySchema.parse({ families: ["gourmand"] }), "/es/catalogo")).toBe(
      "/es/catalogo?family=gourmand",
    );
    expect(catalogHref(catalogQuerySchema.parse({}), "/es/catalogo")).toBe("/es/catalogo");
  });
});
