import { describe, expect, it, vi } from "vitest";

import { forwardLogin } from "@/lib/auth/proxy";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("login proxy", () => {
  it("forwards a successful login and forces location=backoffice", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        access_token: "tok",
        token_type: "bearer",
        must_change_password: false,
      }),
    );

    const response = await forwardLogin(
      new Request("http://panel.local/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ana@example.com", password: "x", location: "store" }),
      }),
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ access_token: "tok" });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/login$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "ana@example.com",
          password: "x",
          location: "backoffice",
        }),
      }),
    );
  });

  it("forwards 401 and 403 from the API with the same status", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(401, { code: "invalid_credentials", detail: "Credenciales inválidas" }),
      )
      .mockResolvedValueOnce(
        jsonResponse(403, { code: "forbidden", detail: "No tenés acceso al panel." }),
      );

    const unauthorized = await forwardLogin(
      new Request("http://panel.local/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.c", password: "bad" }),
      }),
      fetchImpl,
    );
    expect(unauthorized.status).toBe(401);
    await expect(unauthorized.json()).resolves.toEqual({
      code: "invalid_credentials",
      detail: "Credenciales inválidas",
    });

    const forbidden = await forwardLogin(
      new Request("http://panel.local/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.c", password: "ok" }),
      }),
      fetchImpl,
    );
    expect(forbidden.status).toBe(403);
    await expect(forbidden.json()).resolves.toMatchObject({ code: "forbidden" });
  });

  it("maps upstream outages to 502 JSON", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("down"));
    const response = await forwardLogin(
      new Request("http://panel.local/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.c", password: "x" }),
      }),
      fetchImpl,
    );
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ code: "unavailable" });
  });
});
