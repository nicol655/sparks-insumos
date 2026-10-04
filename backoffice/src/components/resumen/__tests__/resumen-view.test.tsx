import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ResumenView } from "@/components/resumen/resumen-view";

describe("resumen view", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the design's dashboard copy", () => {
    render(<ResumenView />);

    expect(screen.getByText("Lunes 28 de septiembre, 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Buen día, Martina." })).toBeInTheDocument();
    expect(screen.getByText("Ventas · 14 días")).toBeInTheDocument();
    expect(screen.getByText("76")).toBeInTheDocument();
    expect(screen.getByText("$36.289")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getAllByText("$2.758.000")).toHaveLength(2);
    expect(screen.getByText("Ventas · últimos 14 días")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "14D" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByTitle(/\/9 · \$/)).toHaveLength(14);
    expect(screen.getByText("15/9")).toBeInTheDocument();
    expect(screen.getByText("19/9")).toBeInTheDocument();
    expect(screen.getByText("24/9")).toBeInTheDocument();
    expect(screen.getByText("28/9")).toBeInTheDocument();

    for (const id of ["SP-10482", "SP-10481", "SP-10480", "SP-10479", "SP-10478", "SP-10477"]) {
      const row = screen.getByText(id);
      expect(row.closest("a")).toBeNull();
    }
    expect(screen.getByText("Camila Ferrari")).toBeInTheDocument();
    expect(screen.getByText("5 REFERENCIAS")).toBeInTheDocument();
    expect(screen.getAllByText("AGOTADO")).toHaveLength(2);
    expect(screen.getByText("Pistachio Gelato")).toBeInTheDocument();
    expect(screen.getByText("Bharara King")).toBeInTheDocument();
    expect(screen.getByText("¿Vuelve el Set Lattafa Pride?")).toBeInTheDocument();
    expect(screen.getByText("Compra mayorista para revendedor")).toBeInTheDocument();
    expect(screen.getByText("Transferencia del pedido SP-10481")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todos" })).toHaveAttribute("href", "/pedidos");
    expect(screen.getByRole("link", { name: "Bandeja" })).toHaveAttribute("href", "/mensajes");
  });

  it("does not recompute sales or call the network when another range is pressed", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<ResumenView />);

    fireEvent.click(screen.getByRole("button", { name: "7D" }));

    expect(screen.getAllByText("$2.758.000")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "14D" })).toHaveAttribute("aria-pressed", "true");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
