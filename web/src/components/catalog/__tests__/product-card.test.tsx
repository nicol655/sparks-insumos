import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductCard, ProductCardSkeleton } from "@/components/catalog/product-card";
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

const inStock = catalogFor("es").find((product) => product.slug === "bharara-king")!;
const soldOut = catalogFor("es").find((product) => product.stock === 0)!;
const withBadge = catalogFor("es").find((product) => product.badge === "Nuevo")!;

beforeEach(() => {
  useCartStore.setState({ items: [], hydrated: true });
  useUiStore.setState({ overlay: null, toasts: [] });
});

describe("ProductCard", () => {
  it("shows brand, name, price and a descriptive image name", () => {
    renderWithIntl(
      <ul>
        <ProductCard product={inStock} />
      </ul>,
    );

    expect(screen.getByText("Bharara · 100 ml")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "King" })).toBeInTheDocument();
    expect(screen.getByText("$39.000")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: inStock.images.alt })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver King" })).toHaveAttribute(
      "href",
      "/catalogo/bharara-king",
    );
  });

  it("shows the badge when the product carries one", () => {
    renderWithIntl(
      <ul>
        <ProductCard product={withBadge} />
      </ul>,
    );

    expect(screen.getByText("Nuevo")).toBeInTheDocument();
  });

  it("disables adding when the product is sold out", async () => {
    renderWithIntl(
      <ul>
        <ProductCard product={soldOut} />
      </ul>,
    );

    expect(screen.getByText("Sin stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("adds the product and opens the cart overlay", async () => {
    renderWithIntl(
      <ul>
        <ProductCard product={inStock} />
      </ul>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));

    expect(useCartStore.getState().items[0]).toMatchObject({
      productId: inStock.id,
      quantity: 1,
    });
    expect(useUiStore.getState().overlay).toBe("cart");
    expect(useUiStore.getState().toasts[0]?.message).toBe("Agregado al carrito");
  });

  it("renders the skeleton as a loading status", () => {
    renderWithIntl(
      <ul>
        <ProductCardSkeleton label="Cargando" />
      </ul>,
    );

    expect(screen.getByRole("status", { name: "Cargando" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(
      <ul>
        <ProductCard product={inStock} />
      </ul>,
    );

    await expectNoA11yViolations(container);
  });
});
