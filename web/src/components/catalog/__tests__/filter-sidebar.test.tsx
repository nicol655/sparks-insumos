import { screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { catalogFor } from "@/fixtures/catalog";
import { catalogQuerySchema, type Facets } from "@/lib/api/contract";
import { createMockCatalogRepository } from "@/lib/api/mock-repository";
import { unavailableFacets } from "@/lib/catalog/query";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string; query?: Record<string, string | string[]> };
    children: ReactNode;
  } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) => {
    const resolved =
      typeof href === "string"
        ? href
        : href.query
          ? `${href.pathname}?${new URLSearchParams(
              Object.entries(href.query).flatMap(([key, value]) =>
                Array.isArray(value) ? value.map((item) => [key, item]) : [[key, value]],
              ),
            ).toString()}`
          : href.pathname;
    return (
      <a href={resolved} {...rest}>
        {children}
      </a>
    );
  },
}));

const empty = catalogQuerySchema.parse({});
const noneUnavailable = {
  families: [] as string[],
  brands: [] as string[],
  sizes: [] as number[],
  priceBuckets: [] as Array<"low" | "mid" | "high">,
};

describe("FilterSidebar", () => {
  let facets: Facets;

  beforeEach(async () => {
    facets = await createMockCatalogRepository().getFacets("es");
  });

  it("points each chip at the URL that would apply that filter", () => {
    renderWithIntl(
      <FilterSidebar query={empty} facets={facets} unavailable={noneUnavailable} />,
    );

    expect(screen.getByRole("button", { name: "Gourmand" })).toHaveAttribute(
      "href",
      "/es/catalogo?family=gourmand",
    );
    expect(screen.getByRole("button", { name: "Gourmand" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("dims a brand that cannot combine with the current family", () => {
    const query = catalogQuerySchema.parse({ families: ["gourmand"] });
    const unavailable = unavailableFacets(catalogFor("es"), query, facets);

    renderWithIntl(<FilterSidebar query={query} facets={facets} unavailable={unavailable} />);

    expect(screen.getByText("V.V Love")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Lattafa" })).toBeInTheDocument();
  });

  it("exposes each group to assistive technology", () => {
    renderWithIntl(
      <FilterSidebar query={empty} facets={facets} unavailable={noneUnavailable} />,
    );

    expect(screen.getByRole("group", { name: "Familia" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Marca" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(
      <FilterSidebar query={empty} facets={facets} unavailable={noneUnavailable} />,
    );

    await expectNoA11yViolations(container);
  });
});
