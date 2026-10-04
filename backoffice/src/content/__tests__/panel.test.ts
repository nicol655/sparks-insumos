import { describe, expect, it } from "vitest";

import { ajustesGroups } from "@/content/ajustes";
import { navGroups } from "@/content/nav";
import { bars, kpis, lowStock, messages, recentOrders, sales } from "@/content/resumen";
import { sectionTitles } from "@/content/sections";

describe("panel copy", () => {
  it("lists every nav item and the design counts", () => {
    const items = navGroups.flatMap((group) => group.items);
    expect(navGroups.map((group) => group.title)).toEqual(["Operación", "Clientes", "Sitio"]);
    expect(items.map((item) => item.label)).toEqual([
      "Resumen",
      "Pedidos",
      "Catálogo",
      "Mensajes",
      "Usuarios",
      "Cupones",
      "Contenido",
      "Ajustes",
    ]);
    expect(items.find((item) => item.label === "Pedidos")?.count).toBe("2");
    expect(items.find((item) => item.label === "Catálogo")?.count).toBeUndefined();
    expect(items.find((item) => item.label === "Mensajes")?.count).toBe("3");
    expect(items.find((item) => item.label === "Usuarios")?.count).toBeUndefined();
    expect(items.find((item) => item.label === "Cupones")?.count).toBe("3");
  });

  it("freezes the 14-day resumen", () => {
    expect(kpis.map((kpi) => kpi.value)).toEqual(["$2.758.000", "76", "$36.289", "7"]);
    expect(sales.total).toBe("$2.758.000");
    expect(bars).toHaveLength(14);
    expect(bars[0]?.title).toBe("15/9 · $144.000");
    expect(bars[13]?.title).toBe("28/9 · $214.000");
    expect(recentOrders.map((order) => order.id)).toEqual([
      "SP-10482",
      "SP-10481",
      "SP-10480",
      "SP-10479",
      "SP-10478",
      "SP-10477",
    ]);
    expect(lowStock).toHaveLength(5);
    expect(messages).toHaveLength(3);
  });

  it("freezes the settings values from the design", () => {
    expect(ajustesGroups.map((group) => group.title)).toEqual([
      "Tienda",
      "Envíos",
      "Descuentos automáticos",
      "Medios de pago",
      "Idiomas y moneda",
    ]);
    const fields = ajustesGroups.flatMap((group) => group.fields);
    expect(fields.find((field) => field.label === "Email de contacto")?.value).toBe(
      "hola@sparksparfums.com",
    );
    expect(fields.find((field) => field.label === "CBU / alias")?.value).toBe(
      "0000003100012345678901",
    );
    expect(fields.find((field) => field.label === "Cuotas sin interés")?.value).toBe("Hasta 3");
  });

  it("names the section titles", () => {
    expect(Object.values(sectionTitles)).toEqual([
      "Pedidos",
      "Catálogo",
      "Mensajes",
      "Usuarios",
      "Cupones",
      "Contenido",
    ]);
  });
});
