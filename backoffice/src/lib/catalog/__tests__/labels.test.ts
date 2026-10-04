import { describe, expect, it } from "vitest";

import { formatPrice, photoCount, shortenFileName, typeLabel, visibilityLabel } from "@/lib/catalog/labels";

describe("catalog labels", () => {
  it("names the three visibility values and the two types", () => {
    expect(visibilityLabel).toEqual({
      visible: "Publicado",
      hidden: "Borrador",
      not_listed: "No listado",
    });
    expect(typeLabel).toEqual({ digital: "Digital", physical: "Físico" });
  });

  it("counts photos and formats the price in ARS", () => {
    expect(photoCount(1)).toBe("1 foto");
    expect(photoCount(3)).toBe("3 fotos");
    expect(formatPrice(1200.1)).toBe(
      new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(1200.1),
    );
  });

  it("keeps a short file name and cuts a long one without losing the extension", () => {
    expect(shortenFileName("perfume 1.webp")).toBe("perfume 1.webp");
    expect(shortenFileName("nombre_muy_largo_para_el_cuadro.png")).toBe("nombre_mu... .png");
    expect(shortenFileName("notas_sin_extension_demasiado_larga")).toBe("notas_sin_exte...");
  });
});
