import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Shell } from "@/components/shell/shell";

const nav = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
}));

const storeUrl = "http://localhost:3000";

function renderShell() {
  return render(
    <Shell storeUrl={storeUrl}>
      <p>contenido</p>
    </Shell>,
  );
}

describe("shell", () => {
  it("lists the menu, the operator and the header on the resumen", () => {
    nav.pathname = "/dashboard";
    renderShell();

    expect(screen.getByText("Sparks")).toBeInTheDocument();
    expect(screen.getByText("Backoffice")).toBeInTheDocument();
    expect(screen.getByText("Operación")).toBeInTheDocument();
    expect(screen.getByText("Clientes")).toBeInTheDocument();
    expect(screen.getByText("Sitio")).toBeInTheDocument();
    expect(screen.getByText("Martina Álvarez")).toBeInTheDocument();
    expect(screen.getByText("Administradora")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Resumen" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Resumen" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Pedidos/ })).toHaveAttribute("href", "/pedidos");
    expect(screen.getByRole("link", { name: /Pedidos/ })).toHaveTextContent("2");
    expect(screen.getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/catalogo");
    expect(screen.getByRole("link", { name: "Catálogo" })).not.toHaveTextContent("5");
    expect(screen.getByRole("link", { name: /Mensajes/ })).toHaveTextContent("3");
    expect(screen.getByRole("link", { name: "Usuarios" })).toHaveAttribute("href", "/usuarios");
    expect(screen.getByRole("link", { name: "Usuarios" })).not.toHaveTextContent("10");
    expect(screen.getByRole("link", { name: /Cupones/ })).toHaveTextContent("3");
    expect(screen.getByRole("link", { name: "Contenido" })).toHaveAttribute("href", "/contenido");
    expect(screen.getByRole("link", { name: "Ajustes" })).toHaveAttribute("href", "/ajustes");

    expect(screen.getByText("Backoffice / Resumen")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar pedidos, productos o clientes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver tienda" })).toHaveAttribute("href", storeUrl);
    expect(screen.queryByText("Sparks Perfumes.dc.html")).not.toBeInTheDocument();
    expect(screen.queryByText("Sin coincidencias.")).not.toBeInTheDocument();

    const menu = screen.getByRole("button", { name: "Menú" });
    expect(menu.className).toContain("lg:hidden");
  });

  it("uses the section title in the breadcrumb", () => {
    nav.pathname = "/ajustes";
    renderShell();
    expect(screen.getByText("Backoffice / Ajustes")).toBeInTheDocument();
  });

  it("keeps the catalog crumb on the create page", () => {
    nav.pathname = "/catalogo/nuevo";
    renderShell();
    expect(screen.getByText("Backoffice / Catálogo")).toBeInTheDocument();
  });
});
