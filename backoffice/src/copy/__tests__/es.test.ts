import { describe, expect, it } from "vitest";

import { copy } from "@/copy/es";

describe("copy", () => {
  it("keeps the unauthorized sentence from RF-6", () => {
    expect(copy.unauthorizedMessage).toBe(
      "No podés entrar a esta sección sin iniciar sesión.",
    );
  });

  it("does not carry the example brand", () => {
    const blob = JSON.stringify(copy);
    expect(blob).not.toMatch(/ADS/i);
    expect(blob).not.toMatch(/adsinversiones/i);
  });
});
