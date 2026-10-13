import { describe, expect, it, vi } from "vitest";

import { env } from "@/lib/env";
import { CATALOG_TOKEN_HEADER } from "@/lib/catalog/token-header";
import {
  forwardPermissions,
  forwardRoleById,
  forwardRolePermissions,
  forwardRolesCollection,
} from "@/lib/roles/proxy";

const fetchImpl = vi.fn<typeof fetch>();
const roleId = "22222222-2222-4222-8222-222222222222";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("roles proxy", () => {
  it("does not call the API without a bearer", async () => {
    fetchImpl.mockReset();
    const response = await forwardRolesCollection(
      new Request("http://panel.local/api/roles"),
      fetchImpl,
    );
    expect(response.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forwards GET statistics and POST create", async () => {
    fetchImpl.mockReset();
    fetchImpl.mockImplementation(async () => json([]));
    await forwardRolesCollection(
      new Request("http://panel.local/api/roles?limit=50", {
        headers: { [CATALOG_TOKEN_HEADER]: "tok" },
      }),
      fetchImpl,
    );
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`${env.API_BASE_URL}/roles/statistics?limit=50`);

    fetchImpl.mockImplementation(async () => json({ id: roleId }, 201));
    await forwardRolesCollection(
      new Request("http://panel.local/api/roles", {
        method: "POST",
        headers: {
          Authorization: "Bearer tok",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug: "ops", name: "Ops" }),
      }),
      fetchImpl,
    );
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(`${env.API_BASE_URL}/roles`);
    expect(fetchImpl.mock.calls[1]?.[1]?.method).toBe("POST");
  });

  it("patches and deletes only uuids", async () => {
    fetchImpl.mockReset();
    fetchImpl.mockImplementation(async () => json({ id: roleId }));
    const patched = await forwardRoleById(
      new Request("http://panel.local/api/roles/x", {
        method: "PATCH",
        headers: { Authorization: "Bearer tok" },
      }),
      roleId,
      fetchImpl,
    );
    expect(patched.status).toBe(200);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`${env.API_BASE_URL}/roles/${roleId}`);

    fetchImpl.mockClear();
    const missing = await forwardRoleById(
      new Request("http://panel.local/api/roles/nope", {
        method: "DELETE",
        headers: { Authorization: "Bearer tok" },
      }),
      "nope",
      fetchImpl,
    );
    expect(missing.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forwards permissions catalog and role permission replace", async () => {
    fetchImpl.mockReset();
    fetchImpl.mockImplementation(async () => json([]));
    await forwardPermissions(
      new Request("http://panel.local/api/permissions", {
        headers: { Authorization: "Bearer tok" },
      }),
      fetchImpl,
    );
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`${env.API_BASE_URL}/permissions`);

    fetchImpl.mockImplementation(async () => json({ id: roleId }));
    await forwardRolePermissions(
      new Request("http://panel.local/api/roles/x/permissions", {
        method: "PUT",
        headers: {
          Authorization: "Bearer tok",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permission_ids: [] }),
      }),
      roleId,
      fetchImpl,
    );
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      `${env.API_BASE_URL}/roles/${roleId}/permissions`,
    );
  });
});
