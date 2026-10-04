import { describe, expect, it } from "vitest";

import { decideRedirect } from "@/lib/auth/guard";

describe("decideRedirect", () => {
  it("does not redirect before sessionStorage has rehydrated", () => {
    expect(decideRedirect("/dashboard", false, false)).toBeNull();
    expect(decideRedirect("/login", true, false)).toBeNull();
    expect(decideRedirect("/", false, false)).toBeNull();
  });

  it("sends an anonymous visitor away from every private path", () => {
    expect(decideRedirect("/", false, true)).toBe("/unauthorized");
    expect(decideRedirect("/dashboard", false, true)).toBe("/unauthorized");
    expect(decideRedirect("/pedidos", false, true)).toBe("/unauthorized");
    expect(decideRedirect("/ajustes", false, true)).toBe("/unauthorized");
    expect(decideRedirect("/login", false, true)).toBeNull();
    expect(decideRedirect("/unauthorized", false, true)).toBeNull();
  });

  it("sends a signed-in visitor to the dashboard from the public paths and /", () => {
    expect(decideRedirect("/login", true, true)).toBe("/dashboard");
    expect(decideRedirect("/unauthorized", true, true)).toBe("/dashboard");
    expect(decideRedirect("/", true, true)).toBe("/dashboard");
    expect(decideRedirect("/dashboard", true, true)).toBeNull();
    expect(decideRedirect("/ajustes", true, true)).toBeNull();
    expect(decideRedirect("/pedidos", true, true)).toBeNull();
  });
});
