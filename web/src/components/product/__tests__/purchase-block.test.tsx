import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { PurchaseBlock } from "@/components/product/purchase-block";
import { catalogFor } from "@/fixtures/catalog";
import { useCartStore } from "@/lib/cart/store";
import { useUiStore } from "@/lib/ui/store";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const inStock = catalogFor("es").find((item) => item.slug === "bharara-king")!;
const soldOut = catalogFor("es").find((item) => item.stock === 0)!;

beforeEach(() => {
  useCartStore.setState({ items: [], hydrated: true });
  useUiStore.setState({ overlay: null, toasts: [] });
});

describe("PurchaseBlock", () => {
  it("shows the price and adds the chosen quantity", async () => {
    renderWithIntl(<PurchaseBlock product={inStock} />);

    expect(screen.getByText("$39.000")).toBeInTheDocument();
    expect(screen.getByText("Hasta 3 cuotas sin interés")).toBeInTheDocument();
    const stock = screen.getByText("En stock");
    expect(stock.className).toContain("text-ink");
    expect(stock.className).not.toContain("text-success");

    await userEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    await userEvent.click(screen.getByRole("button", { name: "Agregar al carrito" }));

    expect(useCartStore.getState().items[0]).toMatchObject({
      productId: inStock.id,
      quantity: 2,
    });
    expect(useUiStore.getState().overlay).toBe("cart");
    expect(useUiStore.getState().toasts[0]?.message).toBe("Agregado al carrito");
  });

  it("asks about this perfume when stock is unknown", () => {
    renderWithIntl(<PurchaseBlock product={{ ...inStock, stock: null }} />);

    expect(screen.getByText("$39.000")).toBeInTheDocument();
    expect(screen.queryByText("En stock")).not.toBeInTheDocument();
    expect(screen.queryByText("Sin stock")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar al carrito" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Consultar este perfume" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/wa\.me\/5491168692694\?text=/),
    );
  });

  it("offers WhatsApp when the bottle is sold out", () => {
    renderWithIntl(<PurchaseBlock product={soldOut} />);

    expect(screen.getByText("Sin stock")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar al carrito" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Consultar stock por WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/wa\.me\/5491168692694\?text=/),
    );
    expect(screen.queryByRole("link", { name: "Consultar este perfume" })).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<PurchaseBlock product={inStock} />);

    await expectNoA11yViolations(container);
  });
});
