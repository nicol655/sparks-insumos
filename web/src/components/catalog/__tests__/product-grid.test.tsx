import { screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductGrid, ProductGridSkeleton } from "@/components/catalog/product-grid";
import { catalogFor } from "@/fixtures/catalog";
import { useCartStore } from "@/lib/cart/store";
import { useUiStore } from "@/lib/ui/store";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string; params?: Record<string, string> };
    children: ReactNode;
  } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) => {
    const resolved =
      typeof href === "string"
        ? href
        : href.pathname.replace("[slug]", href.params?.slug ?? "");
    return (
      <a href={resolved} {...rest}>
        {children}
      </a>
    );
  },
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

beforeEach(() => {
  useCartStore.setState({ items: [], hydrated: true });
  useUiStore.setState({ overlay: null });
});

describe("ProductGrid", () => {
  it("renders the catalogue as a list of product cards", () => {
    const products = catalogFor("es").slice(0, 2);

    renderWithIntl(<ProductGrid products={products} label="Resultados del catálogo" />);

    expect(screen.getByRole("list", { name: "Resultados del catálogo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `Ver ${products[0]!.name}` })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `Ver ${products[1]!.name}` })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(
      <ProductGrid products={catalogFor("es").slice(0, 2)} label="Resultados del catálogo" />,
    );

    await expectNoA11yViolations(container);
  });
});

describe("ProductGridSkeleton", () => {
  it("announces loading once for the whole grid", () => {
    renderWithIntl(<ProductGridSkeleton label="Cargando" />);

    expect(screen.getByRole("status", { name: "Cargando" })).toBeInTheDocument();
  });
});
