import { screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ActiveFilters } from "@/components/catalog/active-filters";
import { catalogQuerySchema } from "@/lib/api/contract";
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

describe("ActiveFilters", () => {
  it("renders nothing when no facet is applied", () => {
    const { container } = renderWithIntl(
      <ActiveFilters query={catalogQuerySchema.parse({})} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("links each chip to the query without that filter", () => {
    renderWithIntl(
      <ActiveFilters
        query={catalogQuerySchema.parse({
          families: ["gourmand"],
          brands: ["Lattafa"],
          sort: "price-asc",
        })}
      />,
    );

    expect(screen.getByRole("link", { name: "Quitar filtro: Gourmand" })).toHaveAttribute(
      "href",
      "/es/catalogo?brand=Lattafa&sort=price-asc",
    );
    expect(screen.getByRole("link", { name: "Quitar filtros" })).toHaveAttribute(
      "href",
      "/es/catalogo?sort=price-asc",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(
      <ActiveFilters query={catalogQuerySchema.parse({ families: ["gourmand"] })} />,
    );

    await expectNoA11yViolations(container);
  });
});
