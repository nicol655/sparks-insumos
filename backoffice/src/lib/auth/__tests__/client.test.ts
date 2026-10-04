import { afterEach, describe, expect, it, vi } from "vitest";

import { createLoginClient } from "@/lib/auth/client";

const token = {
  access_token: "opaque-token",
  token_type: "bearer" as const,
  must_change_password: false,
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("login client", () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("posts credentials and returns the bearer", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, token));
    const client = createLoginClient("http://panel.test", fetchImpl);

    const result = await client.login({ email: " Ana@Example.com ", password: "secret" });

    expect(result).toEqual({
      ok: true,
      accessToken: "opaque-token",
      mustChangePassword: false,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://panel.test/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "ana@example.com",
          password: "secret",
          location: "backoffice",
        }),
      }),
    );
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("maps 401 to invalid_credentials and does not treat the body as a token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(401, { code: "invalid_credentials", access_token: "nope" }),
    );
    const result = await createLoginClient("", fetchImpl).login({
      email: "a@b.c",
      password: "bad",
    });

    expect(result).toEqual({ ok: false, code: "invalid_credentials" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("maps 403 to forbidden when the role lacks panel access", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(403, { code: "forbidden", detail: "No tenés acceso al panel." }),
    );
    const result = await createLoginClient("", fetchImpl).login({
      email: "a@b.c",
      password: "ok",
    });

    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("maps network errors, 500 and invalid JSON to unavailable", async () => {
    const network = vi.fn().mockRejectedValue(new Error("down"));
    expect(
      await createLoginClient("", network).login({ email: "a@b.c", password: "x" }),
    ).toEqual({ ok: false, code: "unavailable" });

    const server = vi.fn().mockResolvedValue(jsonResponse(500, { detail: "no" }));
    expect(
      await createLoginClient("", server).login({ email: "a@b.c", password: "x" }),
    ).toEqual({ ok: false, code: "unavailable" });

    const badJson = vi.fn().mockResolvedValue(
      new Response("not-json", { status: 200, headers: { "Content-Type": "text/plain" } }),
    );
    expect(
      await createLoginClient("", badJson).login({ email: "a@b.c", password: "x" }),
    ).toEqual({ ok: false, code: "unavailable" });
  });

  it("does not log the token, the body or an Authorization header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, token));
    await createLoginClient("", fetchImpl).login({
      email: "a@b.c",
      password: "secret",
    });

    const printed = [log, info, warn, error, debug].flatMap((spy) => spy.mock.calls).join(" ");
    expect(printed).not.toContain("opaque-token");
    expect(printed).not.toContain("secret");
    expect(printed).not.toContain("Authorization");
  });
});
