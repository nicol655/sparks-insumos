import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CartSummary } from "@/components/cart/cart-summary";
import { catalogFor } from "@/fixtures/catalog";
import type { Product } from "@/lib/api/contract";
import type { CartLine, ResolvedCart } from "@/lib/cart/store";
import { useUiStore } from "@/lib/ui/store";
import { buildOrderMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    onClick?: () => void;
  } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
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

function cartWith(lines: CartLine[]): ResolvedCart {
  return {
    lines,
    unavailable: [],
    subtotal: lines.reduce((total, line) => total + line.lineTotal, 0),
    count: lines.reduce((total, line) => total + line.quantity, 0),
  };
}

const ORDER_HREF = buildWhatsappUrl({
  message: buildOrderMessage(
    "Hola Sparks, quiero hacer este pedido:",
    ["1x Bharara King (100 ml) — $39.000"],
    "Total: $39.000",
  ),
});

beforeEach(() => {
  useUiStore.setState({ overlay: "cart", toasts: [] });
});

describe("CartSummary", () => {
  it("hides the WhatsApp CTA when there is nothing to order", () => {
    renderWithIntl(<CartSummary cart={cartWith([])} />);

    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Pedir por WhatsApp" })).not.toBeInTheDocument();
  });

  it("builds the order message and can link to the full cart (T084)", async () => {
    renderWithIntl(<CartSummary cart={cartWith([lineFor(king, 1)])} showCartLink />);

    expect(screen.getByText("$39.000")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedir por WhatsApp" })).toHaveAttribute(
      "href",
      ORDER_HREF,
    );
    expect(screen.getByRole("link", { name: "Ver carrito" })).toHaveAttribute("href", "/carrito");

    await userEvent.click(screen.getByRole("link", { name: "Ver carrito" }));
    expect(useUiStore.getState().overlay).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(
      <CartSummary cart={cartWith([lineFor(king, 1)])} showCartLink />,
    );

    await expectNoA11yViolations(container);
  });
});
