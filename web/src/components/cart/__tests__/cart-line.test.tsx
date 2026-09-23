import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CartLineRow } from "@/components/cart/cart-line";
import { catalogFor } from "@/fixtures/catalog";
import type { Product } from "@/lib/api/contract";
import { useCartStore, type CartLine } from "@/lib/cart/store";
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
}));

const king = catalogFor("es").find((product) => product.slug === "bharara-king")!;

function lineFor(product: Product, quantity: number): CartLine {
  return {
    productId: product.id,
    slug: product.slug,
    product,
    quantity,
    unitPrice: product.price.amount,
    lineTotal: product.price.amount * quantity,
  };
}

beforeEach(() => {
  useCartStore.setState({
    items: [{ productId: king.id, slug: king.slug, quantity: 1 }],
    hydrated: true,
  });
});

describe("CartLineRow", () => {
  it("links to the product and refuses to step below one (RF-5)", () => {
    renderWithIntl(
      <ul>
        <CartLineRow line={lineFor(king, 1)} layout="drawer" />
      </ul>,
    );

    expect(screen.getByRole("link", { name: "King" })).toHaveAttribute(
      "href",
      "/catalogo/bharara-king",
    );
    expect(screen.getByRole("button", { name: "Disminuir cantidad" })).toBeDisabled();
    expect(screen.getByRole("status", { name: "Cantidad" })).toHaveTextContent("1");
  });

  it("writes a quantity change and a removal to the store", async () => {
    renderWithIntl(
      <ul>
        <CartLineRow line={lineFor(king, 2)} layout="page" />
      </ul>,
    );

    expect(screen.getByText("$39.000 c/u")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    expect(useCartStore.getState().items[0]?.quantity).toBe(3);

    await userEvent.click(screen.getByRole("button", { name: "Quitar King" }));
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(
      <ul>
        <CartLineRow line={lineFor(king, 1)} layout="page" />
      </ul>,
    );

    await expectNoA11yViolations(container);
  });
});
