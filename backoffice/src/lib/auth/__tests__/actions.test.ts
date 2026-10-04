import { describe, expect, it } from "vitest";

import { createLoginAction } from "@/lib/auth/actions";
import type { LoginClient } from "@/lib/auth/client";

function clientReturning(result: Awaited<ReturnType<LoginClient["login"]>>): LoginClient {
  return { login: () => Promise.resolve(result) };
}

describe("login action", () => {
  it("returns the token when the flag is false", async () => {
    const login = createLoginAction(
      clientReturning({ ok: true, accessToken: "tok", mustChangePassword: false }),
    );
    expect(await login({ email: "a@b.c", password: "x" })).toEqual({
      ok: true,
      accessToken: "tok",
      mustChangePassword: false,
    });
  });

  it("returns the token when the password still has to change", async () => {
    const login = createLoginAction(
      clientReturning({ ok: true, accessToken: "tok", mustChangePassword: true }),
    );
    expect(await login({ email: "a@b.c", password: "x" })).toEqual({
      ok: true,
      accessToken: "tok",
      mustChangePassword: true,
    });
  });

  it("passes invalid credentials and forbidden through, and keeps unavailable", async () => {
    const denied = createLoginAction(clientReturning({ ok: false, code: "invalid_credentials" }));
    expect(await denied({ email: "a@b.c", password: "x" })).toEqual({
      ok: false,
      code: "invalid_credentials",
    });

    const forbidden = createLoginAction(clientReturning({ ok: false, code: "forbidden" }));
    expect(await forbidden({ email: "a@b.c", password: "x" })).toEqual({
      ok: false,
      code: "forbidden",
    });

    const down = createLoginAction(clientReturning({ ok: false, code: "unavailable" }));
    expect(await down({ email: "a@b.c", password: "x" })).toEqual({
      ok: false,
      code: "unavailable",
    });
  });
});
