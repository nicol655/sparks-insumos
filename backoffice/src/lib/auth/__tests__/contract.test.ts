import { describe, expect, it } from "vitest";

import { loginRequestSchema, tokenResponseSchema } from "@/lib/auth/contract";

describe("login contract", () => {
  it("accepts email and password and rejects an extra key", () => {
    expect(loginRequestSchema.parse({ email: "ana@example.com", password: "x" })).toEqual({
      email: "ana@example.com",
      password: "x",
    });
    expect(
      loginRequestSchema.safeParse({ email: "a", password: "b", role: "admin" }).success,
    ).toBe(false);
  });

  it("requires a bearer token and the password flag", () => {
    expect(
      tokenResponseSchema.parse({
        access_token: "tok",
        token_type: "bearer",
        must_change_password: true,
      }),
    ).toMatchObject({ access_token: "tok", must_change_password: true });

    expect(tokenResponseSchema.safeParse({ access_token: "", token_type: "bearer", must_change_password: false }).success).toBe(false);
    expect(
      tokenResponseSchema.safeParse({
        access_token: "tok",
        token_type: "basic",
        must_change_password: false,
      }).success,
    ).toBe(false);
  });
});
