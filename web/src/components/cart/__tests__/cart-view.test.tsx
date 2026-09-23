import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CartView } from "@/components/cart/cart-view";
import { catalogFor } from "@/fixtures/catalog";
import { useCartStore } from "@/lib/cart/store";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

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
}));

const king = catalogFor("es").find((product) => product.slug === "bharara-king")!;
const soldOut = catalogFor("es").find((product) => product.stock === 0)!;

beforeEach(() => {
  useCartStore.setState({ items: [], hydrated: true });
});

describe("CartView", () => {
  it("shows the empty state once the store has hydrated", () => {
    renderWithIntl(<CartView />);

    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver catálogo" })).toHaveAttribute("href", "/catalogo");
  });

  it("renders the resolved row and a WhatsApp checkout", async () => {
    useCartStore.setState({
      items: [{ productId: king.id, slug: king.slug, quantity: 2 }],
      hydrated: true,
    });

    renderWithIntl(<CartView />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "King" })).toBeInTheDocument();
    });

    expect(screen.getAllByText("$78.000").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Pedir por WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringMatching(/wa\.me\/5491168692694/),
    );
    expect(screen.queryByRole("link", { name: "Ver carrito" })).not.toBeInTheDocument();
  });

  it("lets the shopper drop a line that sold out after it was added", async () => {
    useCartStore.setState({
      items: [{ productId: soldOut.id, slug: soldOut.slug, quantity: 1 }],
      hydrated: true,
    });

    renderWithIntl(<CartView />);

    await waitFor(() => {
      expect(screen.getByText("Ya no está disponible")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: `Quitar ${soldOut.slug}` }));
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("has no accessibility violations in the empty state", async () => {
    const { container } = renderWithIntl(<CartView />);

    await expectNoA11yViolations(container);
  });
});
