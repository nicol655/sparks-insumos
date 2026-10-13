import { describe, expect, it } from "vitest";

import {
  createRoleBody,
  duplicateDraft,
  missingRoleField,
  patchRoleBody,
  permissionsBody,
} from "@/lib/roles/form";

describe("roles form", () => {
  it("requires name and slug", () => {
    expect(missingRoleField({ slug: "", name: "Ops", permissionIds: [] })).toBe(
      "Completá el slug del rol.",
    );
    expect(missingRoleField({ slug: "ops", name: "  ", permissionIds: [] })).toBe(
      "Completá el nombre del rol.",
    );
    expect(missingRoleField({ slug: "ops", name: "Ops", permissionIds: [] })).toBeNull();
  });

  it("builds create, patch and permissions bodies", () => {
    expect(
      createRoleBody({ slug: " Ops ", name: " Operaciones ", permissionIds: ["a"] }),
    ).toEqual({
      slug: "ops",
      name: "Operaciones",
      permission_ids: ["a"],
    });
    expect(
      patchRoleBody(
        { slug: "ops", name: "Nuevo", permissionIds: [] },
        { slug: "ops", name: "Viejo" },
      ),
    ).toEqual({ name: "Nuevo" });
    expect(
      patchRoleBody(
        { slug: "ops", name: "Ops", permissionIds: [] },
        { slug: "ops", name: "Ops" },
      ),
    ).toBeNull();
    expect(permissionsBody({ slug: "ops", name: "Ops", permissionIds: ["a", "b"] })).toEqual({
      permission_ids: ["a", "b"],
    });
  });

  it("duplicates with copia suffixes", () => {
    expect(
      duplicateDraft({
        slug: "admin",
        name: "Administrador",
        permission_ids: ["p1"],
      }),
    ).toEqual({
      slug: "admin-copia",
      name: "Administrador (copia)",
      permissionIds: ["p1"],
    });
  });
});
