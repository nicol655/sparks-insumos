import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CartAside } from "@/components/cart/cart-aside";
import { catalogFor } from "@/fixtures/catalog";
import type { Product } from "@/lib/api/contract";
import type { CartLine, ResolvedCart } from "@/lib/cart/store";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const king = catalogFor("es").find((product) => product.slug === "bharara-king")!;
const yara = catalogFor("es").find((product) => product.slug === "lattafa-yara")!;

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

describe("CartAside", () => {
  it("shows the prototype summary and a WhatsApp CTA at or above $30.000 (AC-4, AC-6)", () => {
    renderWithIntl(<CartAside cart={cartWith([lineFor(king, 1)])} />);

    expect(screen.getByText("Resumen")).toBeInTheDocument();
    expect(screen.getByText("A cotizar")).toBeInTheDocument();
    expect(screen.getByText(/Mínimo de compra \$30\.000/)).toBeInTheDocument();
    expect(screen.getAllByText("$39.000")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Finalizar compra" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/wa\.me\/5491168692694/),
    );
  });

  it("does not build a WhatsApp order when the subtotal is under the floor (AC-7)", () => {
    renderWithIntl(<CartAside cart={cartWith([lineFor(yara, 1)])} />);

    expect(screen.queryByRole("link", { name: "Finalizar compra" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finalizar compra" })).toBeDisabled();
  });

  it("does not send when Aplicar is clicked (AC-5)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWithIntl(<CartAside cart={cartWith([lineFor(king, 1)])} />);

    await userEvent.type(screen.getByLabelText("Cupón"), "VIP15");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getAllByText("$39.000")).toHaveLength(2);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fetchSpy.mockRestore();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<CartAside cart={cartWith([lineFor(king, 1)])} />);

    await expectNoA11yViolations(container);
  });
});
