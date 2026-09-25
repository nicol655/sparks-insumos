import { describe, expect, it, vi } from "vitest";

import { createAuthClient, type AuthClient } from "@/lib/auth/client";
import type { UserPublic } from "@/lib/auth/contract";
import type { RegisterInput } from "@/lib/auth/validate";

const BASE = "http://api.test";
const TOKEN = "opaque-session-token";

const USER: UserPublic = {
  id: "6b1e2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e",
  first_name: "Camila",
  last_name: "Ferrari",
  email: "camila@mail.com",
  phone: "+5491168692694",
  active: true,
  must_change_password: false,
  terms_accepted_at: "2026-09-25T12:00:00Z",
  created_at: "2026-09-25T12:00:00Z",
  updated_at: "2026-09-25T12:00:00Z",
};

const REGISTER: RegisterInput = {
  firstName: " Camila ",
  lastName: " Ferrari ",
  email: "  Camila@Mail.com ",
  phone: " +5491168692694 ",
  password: "Sparks1!",
};

type Captured = { url: string; method: string; headers: Headers; body: string | undefined };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function install(handler: (captured: Captured) => Response | Promise<Response>): {
  client: AuthClient;
  calls: Captured[];
} {
  const calls: Captured[] = [];
  const client = createAuthClient(BASE, async (input, init) => {
    const captured = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : undefined,
    };
    calls.push(captured);
    return handler(captured);
  });
  return { client, calls };
}

describe("auth client", () => {
  it("registers with the seven API fields and a copied password confirmation", async () => {
    const { client, calls } = install(() => json(201, USER));

    const result = await client.register(REGISTER);

    expect(result).toEqual({ ok: true, status: 201, data: USER });
    const body = JSON.parse(calls[0]?.body ?? "{}") as Record<string, unknown>;
    expect(calls[0]?.url).toBe(`${BASE}/auth/register`);
    expect(calls[0]?.method).toBe("POST");
    expect(body).toEqual({
      first_name: "Camila",
      last_name: "Ferrari",
      email: "camila@mail.com",
      password: "Sparks1!",
      password_confirmation: "Sparks1!",
      phone: "+5491168692694",
      accept_terms: true,
    });
  });

  it("logs in with email and password", async () => {
    const token = {
      access_token: TOKEN,
      token_type: "bearer",
      must_change_password: false,
    };
    const { client, calls } = install(() => json(200, token));

    const result = await client.login({ email: " Camila@Mail.com ", password: "Sparks1!" });

    expect(result).toEqual({ ok: true, status: 200, data: token });
    expect(calls[0]?.url).toBe(`${BASE}/auth/login`);
    expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
      email: "camila@mail.com",
      password: "Sparks1!",
    });
  });

  it("sends the bearer on logout, getMe, patchMe and deleteMe", async () => {
    const { client, calls } = install((captured) => {
      if (captured.method === "GET" || captured.method === "PATCH") return json(200, USER);
      return new Response(null, { status: 204 });
    });
    const patch = {
      first_name: "Ana",
      last_name: "Pérez",
      email: "ana@example.com",
      phone: "+5491168692694",
    };

    await client.logout(TOKEN);
    await client.getMe(TOKEN);
    await client.patchMe(TOKEN, patch);
    await client.deleteMe(TOKEN);

    expect(calls.map((call) => [call.method, call.url])).toEqual([
      ["POST", `${BASE}/auth/logout`],
      ["GET", `${BASE}/me`],
      ["PATCH", `${BASE}/me`],
      ["DELETE", `${BASE}/me`],
    ]);
    for (const call of calls) {
      expect(call.headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);
    }
    expect(JSON.parse(calls[2]?.body ?? "{}")).toEqual(patch);
    expect(calls[2]?.body).not.toContain("password");
  });

  it("distinguishes 401, the password-change 403, email_taken and a broken success body", async () => {
    const cases: Array<[Response, string]> = [
      [json(401, { code: "invalid_credentials", detail: "Credenciales inválidas" }), "invalid_credentials"],
      [
        json(403, { code: "password_change_required", detail: "Cambiala." }),
        "password_change_required",
      ],
      [json(409, { code: "email_taken", detail: "Ese correo ya está registrado." }), "email_taken"],
      [json(200, { access_token: TOKEN }), "contract"],
    ];

    for (const [response, code] of cases) {
      const { client } = install(() => response);
      const result = await client.login({ email: "a@b.co", password: "Sparks1!" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe(code);
    }
  });

  it("does not log the token or the password", async () => {
    const methods = ["log", "info", "warn", "error", "debug"] as const;
    const spies = methods.map((name) => vi.spyOn(console, name).mockImplementation(() => undefined));
    const { client } = install(() =>
      json(200, { access_token: TOKEN, token_type: "bearer", must_change_password: false }),
    );

    await client.login({ email: "a@b.co", password: "Sparks1!" });

    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });
});
