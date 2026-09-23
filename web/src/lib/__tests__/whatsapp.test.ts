import { describe, expect, it } from "vitest";

import { buildOrderMessage, buildWhatsappUrl } from "@/lib/whatsapp";

/** AC-18 — §06 of the design specification. */
describe("buildWhatsappUrl", () => {
  it("points at the business number from the document", () => {
    expect(buildWhatsappUrl({ message: "Hola" })).toBe("https://wa.me/5491168692694?text=Hola");
  });

  it("encodes accents, spaces and symbols", () => {
    const url = buildWhatsappUrl({
      message: "Hola, ¿tenés stock de Bharara King 100ml? Precio: $39.000 & envío",
    });

    expect(url).toBe(
      "https://wa.me/5491168692694?text=Hola%2C%20%C2%BFten%C3%A9s%20stock%20de%20Bharara%20King%20100ml%3F%20Precio%3A%20%2439.000%20%26%20env%C3%ADo",
    );
  });

  it("keeps line breaks in multi-line order messages", () => {
    expect(buildWhatsappUrl({ message: "Pedido:\n1x King" })).toContain("Pedido%3A%0A1x%20King");
  });

  it("accepts an explicit number", () => {
    expect(buildWhatsappUrl({ message: "Hola", phone: "5491122223333" })).toContain(
      "/5491122223333?",
    );
  });

  it.each(["+5491168692694", "54 9 11", "not-a-number", ""])(
    "rejects the malformed number %s",
    (phone) => {
      expect(() => buildWhatsappUrl({ message: "Hola", phone })).toThrow(/Invalid WhatsApp number/);
    },
  );

  it("refuses to build a link without a message", () => {
    expect(() => buildWhatsappUrl({ message: "   " })).toThrow(/preloaded message/);
  });
});

describe("buildOrderMessage", () => {
  it("joins the intro, each bottle and the total on their own lines", () => {
    expect(
      buildOrderMessage(
        "Hola Sparks, quiero hacer este pedido:",
        ["1x Bharara King (100 ml) — $39.000"],
        "Total: $39.000",
      ),
    ).toBe(
      "Hola Sparks, quiero hacer este pedido:\n1x Bharara King (100 ml) — $39.000\nTotal: $39.000",
    );
  });
});
