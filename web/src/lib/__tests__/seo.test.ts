import { describe, expect, it } from "vitest";

import { localizedHref, seoMetadata } from "@/lib/seo";

describe("localizedHref", () => {
  it("prefixes the locale and translates the catalogue path", () => {
    expect(localizedHref("/", "es")).toBe("/es");
    expect(localizedHref("/catalogo", "es")).toBe("/es/catalogo");
    expect(localizedHref("/catalogo", "en")).toBe("/en/catalogue");
    expect(localizedHref("/catalogo/[slug]", "en", { slug: "bharara-king" })).toBe(
      "/en/catalogue/bharara-king",
    );
    expect(localizedHref("/carrito", "en")).toBe("/en/cart");
  });
});

describe("seoMetadata", () => {
  it("emits hreflang pairs and a 1200×630 Open Graph image", () => {
    const meta = seoMetadata({
      locale: "es",
      pathname: "/catalogo",
      title: "Catálogo",
      description: "Perfumes",
    });

    expect(meta.alternates).toEqual({
      canonical: "/es/catalogo",
      languages: {
        "es-AR": "/es/catalogo",
        en: "/en/catalogue",
        "x-default": "/es/catalogo",
      },
    });
    expect(meta.openGraph?.images).toEqual([
      { url: "/og.png", width: 1200, height: 630, alt: "Catálogo" },
    ]);
  });
});
