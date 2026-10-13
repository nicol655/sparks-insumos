import { describe, expect, it, vi } from "vitest";

import { createUsersClient } from "@/lib/users/client";
import { CATALOG_TOKEN_HEADER } from "@/lib/catalog/token-header";
import { INVALID_DETAIL, UNAVAILABLE_DETAIL } from "@/lib/users/labels";

const stamp = "2026-09-28T12:00:00Z";

const account = {
  id: "22222222-2222-4222-8222-222222222222",
  first_name: "Ana",
  last_name: "Pérez",
  email: "ana@example.com",
  phone: "+5491168692694",
  active: true,
  must_change_password: false,
  is_super_admin: false,
  terms_accepted_at: stamp,
  created_at: stamp,
  updated_at: stamp,
  role_id: "11111111-1111-4111-8111-111111111111",
  role: "customer",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("users client", () => {
  it("lists accounts and flattens a validation error", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, [account]))
      .mockResolvedValueOnce(jsonResponse(422, { detail: [{ loc: ["body"], msg: "no" }] }));
    const client = createUsersClient("http://panel.test/", fetchImpl);

    await expect(client.listUsers("tok")).resolves.toEqual({ ok: true, users: [account] });
    await expect(
      client.createUser(
        {
          first_name: "Ana",
          last_name: "Pérez",
          email: "ana@example.com",
          phone: "+5491168692694",
          password: "Sparks1!",
        },
        "tok",
      ),
    ).resolves.toEqual({ ok: false, status: 422, detail: INVALID_DETAIL });

    const sent = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers);
    expect(sent.get("Authorization")).toBe("Bearer tok");
    expect(sent.get(CATALOG_TOKEN_HEADER)).toBe("tok");
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("http://panel.test/users");
  });

  it("patches without a password and maps a dropped network to unavailable", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { ...account, first_name: "Luis" }))
      .mockRejectedValueOnce(new Error("down"));
    const client = createUsersClient("", fetchImpl);
    const patch = {
      first_name: "Luis",
      last_name: "Pérez",
      email: "ana@example.com",
      phone: "+5491168692694",
      active: true,
    };

    await expect(client.updateUser(account.id, patch, "tok")).resolves.toEqual({
      ok: true,
      user: { ...account, first_name: "Luis" },
    });
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).not.toHaveProperty("password");
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`/users/${account.id}`);

    await expect(client.listUsers("tok")).resolves.toEqual({
      ok: false,
      status: 0,
      detail: UNAVAILABLE_DETAIL,
    });
  });
});
