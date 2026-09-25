import { describe, expect, it } from "vitest";

import { safeNext } from "@/lib/auth/return-to";

describe("safeNext", () => {
  it("keeps an internal catalogue path, including its query", () => {
    expect(safeNext("/es/catalogo?q=oud", "es")).toBe("/es/catalogo?q=oud");
    expect(safeNext("/en/catalogue?q=oud", "en")).toBe("/en/catalogue?q=oud");
  });

  it("falls back to the catalogue when next is missing or not this site", () => {
    expect(safeNext(null, "es")).toBe("/es/catalogo");
    expect(safeNext(undefined, "en")).toBe("/en/catalogue");
    expect(safeNext("", "es")).toBe("/es/catalogo");
    expect(safeNext("   ", "es")).toBe("/es/catalogo");
    expect(safeNext("//evil", "es")).toBe("/es/catalogo");
    expect(safeNext("https://evil.example/es/catalogo", "es")).toBe("/es/catalogo");
    expect(safeNext("/es/catalogo\\..\\ingresar", "es")).toBe("/es/catalogo");
    expect(safeNext("/es/catalogo?next=user@host", "es")).toBe("/es/catalogo");
  });

  it("does not send the shopper back to sign-in or register", () => {
    expect(safeNext("/es/ingresar", "es")).toBe("/es/catalogo");
    expect(safeNext("/es/registro?next=/es/cuenta", "es")).toBe("/es/catalogo");
    expect(safeNext("/en/sign-in", "en")).toBe("/en/catalogue");
    expect(safeNext("/en/register", "en")).toBe("/en/catalogue");
  });

  it("rejects a path that belongs to the other locale", () => {
    expect(safeNext("/es/catalogo", "en")).toBe("/en/catalogue");
    expect(safeNext("/en/account", "es")).toBe("/es/catalogo");
  });

  it("allows the account page", () => {
    expect(safeNext("/es/cuenta", "es")).toBe("/es/cuenta");
    expect(safeNext("/en/account", "en")).toBe("/en/account");
  });
});
