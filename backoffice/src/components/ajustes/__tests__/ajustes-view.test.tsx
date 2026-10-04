import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AjustesView } from "@/components/ajustes/ajustes-view";

describe("ajustes view", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows every settings group and the design values", () => {
    render(<AjustesView />);

    expect(screen.getByRole("heading", { level: 1, name: "Ajustes" })).toBeInTheDocument();
    expect(screen.getByText("Tienda, envíos, pagos e idiomas")).toBeInTheDocument();
    for (const title of [
      "Tienda",
      "Envíos",
      "Descuentos automáticos",
      "Medios de pago",
      "Idiomas y moneda",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
    }

    expect(screen.getByLabelText("Nombre comercial")).toHaveValue("Sparks Parfums");
    expect(screen.getByLabelText("Email de contacto")).toHaveValue("hola@sparksparfums.com");
    expect(screen.getByLabelText("WhatsApp de consultas")).toHaveValue("+54 9 11 6869 2694");
    expect(
      screen.getByText("Todos los botones de WhatsApp del sitio usan este número."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Retiro / showroom")).toHaveValue("Franklin, CABA · retiro con turno");
    expect(screen.getByLabelText("Compra mínima (ARS)")).toHaveValue("30000");
    expect(screen.getByLabelText("Plazo de despacho")).toHaveValue("24/48 h hábiles");
    expect(screen.getByLabelText("Transportes")).toHaveValue("Correo Argentino · Transporte a cotizar");
    expect(screen.getByLabelText("Nivel 1 · desde (ARS)")).toHaveValue("100000");
    expect(screen.getByLabelText("Nivel 1 · % off")).toHaveValue("5");
    expect(screen.getByLabelText("Nivel 2 · desde (ARS)")).toHaveValue("300000");
    expect(screen.getByLabelText("Nivel 2 · % off")).toHaveValue("10");
    expect(screen.getByLabelText("Socio del club · % off permanente")).toHaveValue("5");
    expect(screen.getAllByText("Habilitada")).toHaveLength(2);
    expect(screen.getByLabelText("Tarjeta de crédito / débito")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Cuotas sin interés")).toHaveDisplayValue("Hasta 3");
    expect(screen.getByLabelText("CBU / alias")).toHaveValue("0000003100012345678901");
    expect(screen.getByText("Habilitado")).toBeInTheDocument();
    expect(screen.getAllByText("Publicado")).toHaveLength(2);
    expect(screen.getByLabelText("Idioma por defecto")).toHaveDisplayValue("Español");
    expect(screen.getByLabelText("Moneda")).toHaveDisplayValue("Peso argentino (ARS)");

    expect(screen.getByLabelText("Email de contacto")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Cuotas sin interés").querySelectorAll("option")).toHaveLength(1);
  });

  it("does not call the network when settings are saved", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<AjustesView />);

    fireEvent.click(screen.getByRole("button", { name: "Guardar ajustes" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email de contacto")).toHaveValue("hola@sparksparfums.com");
  });
});
