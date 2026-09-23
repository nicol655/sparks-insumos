import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Locale } from "@/i18n/locales";
import { catalogQuerySchema, type CatalogQuery } from "@/lib/api/contract";
import { CatalogContractError, createHttpCatalogRepository } from "@/lib/api/http-repository";
import { createMockCatalogRepository } from "@/lib/api/mock-repository";
import type { CatalogRepository } from "@/lib/api/repository";
import { fromSearchParams } from "@/lib/catalog/search-params";

/**
 * One suite, two adapters (ADR-0003).
 *
 * The fake backend below is not a convenience: it is the executable
 * description of what `api/` has to do. If the real service disagrees with it,
 * the storefront will disagree with the real service.
 */

const BASE_URL = "http://api.test";

function query(overrides: Partial<CatalogQuery> = {}): CatalogQuery {
  return catalogQuerySchema.parse(overrides);
}

function installFakeBackend(): void {
  const mock = createMockCatalogRepository();

  vi.stubGlobal("fetch", async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = new URL(input instanceof URL ? input.toString() : String(input));
    const headers = new Headers(init?.headers);
    const locale = (headers.get("Accept-Language") ?? "es") as Locale;
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const related = /^\/api\/v1\/products\/([^/]+)\/related$/.exec(url.pathname);
    if (related?.[1]) {
      return json(await mock.getRelated(decodeURIComponent(related[1]), locale));
    }

    const single = /^\/api\/v1\/products\/([^/]+)$/.exec(url.pathname);
    if (single?.[1]) {
      const product = await mock.getProduct(decodeURIComponent(single[1]), locale);
      return product ? json(product) : new Response("Not found", { status: 404 });
    }

    if (url.pathname === "/api/v1/products") {
      return json(await mock.listProducts(fromSearchParams(url.searchParams), locale));
    }

    if (url.pathname === "/api/v1/facets") {
      return json(await mock.getFacets(locale));
    }

    if (url.pathname === "/api/v1/search") {
      return json(await mock.search(url.searchParams.get("q") ?? "", locale));
    }

    return new Response("Not found", { status: 404 });
  });
}

const ADAPTERS: Array<[string, () => CatalogRepository]> = [
  ["mock", () => createMockCatalogRepository()],
  ["http", () => createHttpCatalogRepository(BASE_URL)],
];

describe.each(ADAPTERS)("CatalogRepository · %s adapter", (_name, create) => {
  let repository: CatalogRepository;

  beforeEach(() => {
    installFakeBackend();
    repository = create();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("listProducts", () => {
    it("returns the whole catalogue when nothing is filtered", async () => {
      const { items, total } = await repository.listProducts(query(), "es");

      expect(items.length).toBeGreaterThan(0);
      expect(total).toBe(items.length);
    });

    it("filters by olfactive family", async () => {
      const { items } = await repository.listProducts(query({ families: ["gourmand"] }), "es");

      expect(items.length).toBeGreaterThan(0);
      expect(items.every((product) => product.family === "gourmand")).toBe(true);
    });

    it("combines family and brand as an intersection", async () => {
      const { items } = await repository.listProducts(
        query({ families: ["gourmand"], brands: ["Lattafa"] }),
        "es",
      );

      expect(items.length).toBeGreaterThan(0);
      expect(items.every((p) => p.family === "gourmand" && p.brand === "Lattafa")).toBe(true);
    });

    it("treats several values of the same filter as a union", async () => {
      const { items } = await repository.listProducts(
        query({ brands: ["Lattafa", "Afnan"] }),
        "es",
      );

      expect(new Set(items.map((product) => product.brand))).toEqual(
        new Set(["Lattafa", "Afnan"]),
      );
    });

    it("honours the price range inclusively", async () => {
      const { items } = await repository.listProducts(
        query({ priceMin: 24500, priceMax: 32000 }),
        "es",
      );

      expect(items.length).toBeGreaterThan(0);
      expect(items.every((p) => p.price.amount >= 24500 && p.price.amount <= 32000)).toBe(true);
      expect(items.map((p) => p.price.amount)).toContain(24500);
      expect(items.map((p) => p.price.amount)).toContain(32000);
    });

    it("returns an empty result for a combination nobody stocks", async () => {
      const { items, total } = await repository.listProducts(
        query({ families: ["gourmand"], brands: ["V.V Love"] }),
        "es",
      );

      expect(items).toEqual([]);
      expect(total).toBe(0);
    });

    it("orders by ascending price", async () => {
      const { items } = await repository.listProducts(query({ sort: "price-asc" }), "es");
      const amounts = items.map((product) => product.price.amount);

      expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
    });

    it("orders by descending price", async () => {
      const { items } = await repository.listProducts(query({ sort: "price-desc" }), "es");
      const amounts = items.map((product) => product.price.amount);

      expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    });

    it("puts sold-out products last under the default ordering", async () => {
      const { items } = await repository.listProducts(query(), "es");
      const firstSoldOut = items.findIndex((product) => product.stock === 0);

      if (firstSoldOut !== -1) {
        expect(items.slice(firstSoldOut).every((product) => product.stock === 0)).toBe(true);
      }
    });

    it("matches free text against notes, ignoring accents", async () => {
      const { items } = await repository.listProducts(query({ q: "jazmin" }), "es");

      expect(items.length).toBeGreaterThan(0);
      expect(
        items.every((product) =>
          [...product.notes.top, ...product.notes.heart, ...product.notes.base]
            .join(" ")
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .includes("jazmin"),
        ),
      ).toBe(true);
    });

    it("serves localized copy", async () => {
      const [es] = (await repository.listProducts(query({ brands: ["Kayali"] }), "es")).items;
      const [en] = (await repository.listProducts(query({ brands: ["Kayali"] }), "en")).items;

      expect(es?.name).toBe(en?.name); // proper noun, never translated
      expect(es?.description).not.toBe(en?.description);
      expect(es?.notes.base).toContain("Almizcle");
      expect(en?.notes.base).toContain("Musk");
    });
  });

  describe("getProduct", () => {
    it("finds a product by slug", async () => {
      const product = await repository.getProduct("bharara-king", "es");

      expect(product?.brand).toBe("Bharara");
      expect(product?.price).toEqual({ amount: 39000, currency: "ARS" });
    });

    it("returns null for an unknown slug rather than throwing", async () => {
      expect(await repository.getProduct("no-existe", "es")).toBeNull();
    });
  });

  describe("getRelated", () => {
    it("never includes the product itself", async () => {
      const related = await repository.getRelated("bharara-king", "es");

      expect(related.every((product) => product.slug !== "bharara-king")).toBe(true);
    });

    it("leads with the same olfactive family", async () => {
      const related = await repository.getRelated("bharara-king", "es");

      expect(related[0]?.family).toBe("ambar-especias");
    });

    it("returns nothing for an unknown slug", async () => {
      expect(await repository.getRelated("no-existe", "es")).toEqual([]);
    });
  });

  describe("getFacets", () => {
    it("counts every family and brand present in the catalogue", async () => {
      const facets = await repository.getFacets("es");
      const { total } = await repository.listProducts(query(), "es");

      expect(facets.families.reduce((sum, facet) => sum + facet.count, 0)).toBe(total);
      expect(facets.brands.reduce((sum, facet) => sum + facet.count, 0)).toBe(total);
    });

    it("reports the real price range", async () => {
      const facets = await repository.getFacets("es");
      const { items } = await repository.listProducts(query(), "es");
      const amounts = items.map((product) => product.price.amount);

      expect(facets.price.min).toBe(Math.min(...amounts));
      expect(facets.price.max).toBe(Math.max(...amounts));
    });

    it("sorts sizes ascending", async () => {
      const sizes = (await repository.getFacets("es")).sizes.map((facet) => facet.value);

      expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    });
  });

  describe("search", () => {
    it("stays silent below two characters", async () => {
      expect(await repository.search("k", "es")).toEqual([]);
      expect(await repository.search("", "es")).toEqual([]);
    });

    it("returns at most four results", async () => {
      expect((await repository.search("a", "es")).length).toBeLessThanOrEqual(4);
      expect((await repository.search("va", "es")).length).toBeLessThanOrEqual(4);
    });

    it("finds by brand and by note", async () => {
      expect((await repository.search("lattafa", "es")).length).toBeGreaterThan(0);
      expect((await repository.search("vainilla", "es")).length).toBeGreaterThan(0);
    });
  });
});

describe("http adapter · contract enforcement", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a response that does not satisfy the schema", async () => {
    vi.stubGlobal("fetch", async () =>
      new Response(JSON.stringify({ items: [{ id: "x" }], total: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      createHttpCatalogRepository(BASE_URL).listProducts(query(), "es"),
    ).rejects.toBeInstanceOf(CatalogContractError);
  });

  it("propagates a server error instead of swallowing it", async () => {
    vi.stubGlobal("fetch", async () => new Response("boom", { status: 500 }));

    await expect(
      createHttpCatalogRepository(BASE_URL).getFacets("es"),
    ).rejects.toThrow(/500/);
  });

  it("sends the locale as Accept-Language", async () => {
    const fetchSpy = vi.fn<(input: URL | RequestInfo, init?: RequestInit) => Promise<Response>>(
      async () =>
        new Response(JSON.stringify({ items: [], total: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await createHttpCatalogRepository(BASE_URL).listProducts(query(), "en");

    expect(new Headers(fetchSpy.mock.calls[0]?.[1]?.headers).get("Accept-Language")).toBe("en");
  });
});
