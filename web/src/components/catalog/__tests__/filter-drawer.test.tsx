import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilterDrawer } from "@/components/catalog/filter-drawer";
import { FilterToggle } from "@/components/catalog/filter-toggle";
import { catalogQuerySchema, type Facets } from "@/lib/api/contract";
import { createMockCatalogRepository } from "@/lib/api/mock-repository";
import { useUiStore } from "@/lib/ui/store";
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

describe("FilterDrawer", () => {
  let facets: Facets;

  beforeEach(async () => {
    useUiStore.setState({ overlay: null });
    facets = await createMockCatalogRepository().getFacets("es");
  });

  function renderDrawer() {
    return renderWithIntl(
      <>
        <FilterToggle />
        <FilterDrawer query={empty} facets={facets} unavailable={noneUnavailable} />
      </>,
    );
  }

  it("opens as a labelled dialog from the filter toggle", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: "Filtros" }));

    expect(screen.getByRole("dialog", { name: "Filtros" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar filtros" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the toggle", async () => {
    renderDrawer();

    const toggle = screen.getByRole("button", { name: "Filtros" });
    await userEvent.click(toggle);
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  it("has no accessibility violations when open", async () => {
    useUiStore.setState({ overlay: "filters" });
    const { container } = renderWithIntl(
      <FilterDrawer query={empty} facets={facets} unavailable={noneUnavailable} />,
    );

    await expectNoA11yViolations(container);
  });
});
