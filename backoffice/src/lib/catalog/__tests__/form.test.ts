import { describe, expect, it } from "vitest";

import { validateDraft, type Draft } from "@/lib/catalog/form";
import { PHOTO_MESSAGE } from "@/lib/catalog/labels";

const categoryId = "11111111-1111-4111-8111-111111111111";

function photo(name = "a.png", type = "image/png", bytes = 4): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

function draft(overrides: Partial<Draft> = {}): Draft {
  return {
    name: "Rosa",
    description: "Una rosa",
    cost: "10.50",
    price: "20",
    type: "physical",
    visibility: "visible",
    categoryId,
    weight: "",
    length: "",
    width: "",
    height: "",
    sku: "",
    barCode: "",
    brand: "",
    discount: "",
    family: "florales",
    sizeMl: "100",
    tagIds: [],
    photos: [photo()],
    ...overrides,
  };
}

describe("product draft", () => {
  it("names each empty required field and does not build a body", () => {
    const fields: Array<[Partial<Draft>, string]> = [
      [{ name: "  " }, "Nombre"],
      [{ description: "" }, "Descripción"],
      [{ cost: "" }, "Costo"],
      [{ price: "" }, "Precio"],
      [{ type: "" }, "Tipo"],
      [{ visibility: "" }, "Visibilidad"],
      [{ categoryId: "" }, "Categoría"],
      [{ photos: [] }, "Fotos"],
      [{ family: "" }, "Familia"],
      [{ sizeMl: "" }, "Tamaño"],
      [{ sizeMl: "0" }, "Tamaño"],
    ];

    for (const [override, label] of fields) {
      const result = validateDraft(draft(override));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toContain(label);
    }
  });

  it("counts a photo that is already stored", () => {
    expect(validateDraft(draft({ photos: [], keptPhotoCount: 1 })).ok).toBe(true);
    const empty = validateDraft(draft({ photos: [], keptPhotoCount: 0 }));
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.message).toContain("Fotos");
    expect(validateDraft(draft({ photos: [photo("a.gif", "image/gif")], keptPhotoCount: 1 }))).toEqual({
      ok: false,
      message: PHOTO_MESSAGE,
    });
  });

  it("rejects a photo that is too big, a ninth file, or a type that is not allowed", () => {
    const nine = Array.from({ length: 9 }, (_, index) => photo(`${index}.png`));
    expect(validateDraft(draft({ photos: [photo("big.png", "image/png", 5 * 1024 * 1024 + 1)] }))).toEqual({
      ok: false,
      message: PHOTO_MESSAGE,
    });
    expect(validateDraft(draft({ photos: nine }))).toEqual({ ok: false, message: PHOTO_MESSAGE });
    expect(validateDraft(draft({ photos: [photo("a.gif", "image/gif")] }))).toEqual({
      ok: false,
      message: PHOTO_MESSAGE,
    });
  });

  it("keeps a valid draft and drops empty optional fields", () => {
    const result = validateDraft(
      draft({
        brand: "  Acme ",
        weight: "1.50",
        discount: "10",
        tagIds: ["33333333-3333-4333-8333-333333333333"],
        photos: Array.from({ length: 8 }, (_, index) => photo(`${index}.png`)),
      }),
    );
    expect(validateDraft(draft({ photos: [photo("edge.png", "image/png", 5 * 1024 * 1024)] })).ok).toBe(true);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.brand).toBe("Acme");
      expect(result.value.weight).toBe("1.50");
      expect(result.value.discount).toBe("10");
      expect(result.value.sku).toBeUndefined();
      expect(result.value.tagIds).toEqual(["33333333-3333-4333-8333-333333333333"]);
      expect(result.value.photos).toHaveLength(8);
    }
  });

  it("rejects an optional decimal or discount that is not a number", () => {
    const weight = validateDraft(draft({ weight: "no" }));
    const discount = validateDraft(draft({ discount: "1.5" }));
    expect(weight.ok).toBe(false);
    expect(discount.ok).toBe(false);
    if (!weight.ok) expect(weight.message).toContain("Peso");
    if (!discount.ok) expect(discount.message).toContain("Descuento");
  });
});
