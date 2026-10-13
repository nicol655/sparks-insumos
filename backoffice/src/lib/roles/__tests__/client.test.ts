import { describe, expect, it, vi } from "vitest";

import { createRolesClient } from "@/lib/roles/client";
import { INVALID_DETAIL, UNAVAILABLE_DETAIL } from "@/lib/users/labels";

const stamp = "2026-10-06T12:00:00Z";
const roleId = "11111111-1111-4111-8111-111111111111";
const permissionId = "22222222-2222-4222-8222-222222222222";

const stats = {
  id: roleId,
  slug: "ops",
  name: "Ops",
  created_at: stamp,
  updated_at: stamp,
  permission_ids: [permissionId],
  permissions_count: 1,
  users_count: 0,
  locked: false,
  has_backoffice_access: false,
};

const role = {
  id: roleId,
  slug: "ops",
  name: "Ops",
  created_at: stamp,
  updated_at: stamp,
  permission_ids: [permissionId],
};

const permission = {
  id: permissionId,
  controller: "products",
  method: "list",
  created_at: stamp,
  updated_at: stamp,
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("roles client", () => {
  it("lists statistics and permissions", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, [stats]))
      .mockResolvedValueOnce(jsonResponse(200, [permission]));
    const client = createRolesClient("http://panel.test/", fetchImpl);

    await expect(client.listStatistics("tok")).resolves.toEqual({ ok: true, roles: [stats] });
    await expect(client.listPermissions("tok")).resolves.toEqual({
      ok: true,
      permissions: [permission],
    });
  });

  it("creates, patches, replaces permissions and flattens validation errors", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(201, role))
      .mockResolvedValueOnce(jsonResponse(200, role))
      .mockResolvedValueOnce(jsonResponse(200, role))
      .mockResolvedValueOnce(jsonResponse(422, { detail: [{ loc: ["body"], msg: "no" }] }));
    const client = createRolesClient("http://panel.test", fetchImpl);

    await expect(
      client.createRole({ slug: "ops", name: "Ops", permission_ids: [permissionId] }, "tok"),
    ).resolves.toEqual({ ok: true, role });
    await expect(client.updateRole(roleId, { name: "Ops 2" }, "tok")).resolves.toEqual({
      ok: true,
      role,
    });
    await expect(
      client.replacePermissions(roleId, { permission_ids: [permissionId] }, "tok"),
    ).resolves.toEqual({ ok: true, role });
    await expect(
      client.createRole({ slug: "x", name: "X", permission_ids: [] }, "tok"),
    ).resolves.toEqual({ ok: false, status: 422, detail: INVALID_DETAIL });
  });

  it("returns unavailable when the network fails", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("down"));
    const client = createRolesClient("http://panel.test", fetchImpl);
    await expect(client.listStatistics("tok")).resolves.toEqual({
      ok: false,
      status: 0,
      detail: UNAVAILABLE_DETAIL,
    });
  });
});
