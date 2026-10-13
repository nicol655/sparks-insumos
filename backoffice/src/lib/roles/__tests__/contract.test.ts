import { describe, expect, it } from "vitest";

import { permissionSchema, roleSchema, roleStatisticsSchema } from "@/lib/roles/contract";

const stamp = "2026-10-06T12:00:00Z";
const id = "11111111-1111-4111-8111-111111111111";
const permissionId = "22222222-2222-4222-8222-222222222222";

describe("roles contract", () => {
  it("parses statistics rows", () => {
    const parsed = roleStatisticsSchema.safeParse({
      id,
      slug: "admin",
      name: "Administrador",
      created_at: stamp,
      updated_at: stamp,
      permission_ids: [permissionId],
      permissions_count: 1,
      users_count: 2,
      locked: true,
      has_backoffice_access: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects statistics without locked", () => {
    const parsed = roleStatisticsSchema.safeParse({
      id,
      slug: "sales",
      name: "Ventas",
      created_at: stamp,
      updated_at: stamp,
      permission_ids: [],
      permissions_count: 0,
      users_count: 0,
      has_backoffice_access: false,
    });
    expect(parsed.success).toBe(false);
  });

  it("parses role and permission rows", () => {
    expect(
      roleSchema.safeParse({
        id,
        slug: "ops",
        name: "Ops",
        created_at: stamp,
        updated_at: stamp,
        permission_ids: [],
      }).success,
    ).toBe(true);
    expect(
      permissionSchema.safeParse({
        id: permissionId,
        controller: "products",
        method: "list",
        created_at: stamp,
        updated_at: stamp,
      }).success,
    ).toBe(true);
  });
});
