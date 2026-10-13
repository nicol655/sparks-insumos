import { describe, expect, it } from "vitest";

import { userSchema } from "@/lib/users/contract";

const stamp = "2026-09-28T12:00:00Z";

describe("userSchema", () => {
  it("requires role_id and role from the API public user", () => {
    const parsed = userSchema.safeParse({
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
      permissions: null,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.role).toBe("customer");
      expect(parsed.data.permissions).toBeNull();
      expect(parsed.data.is_super_admin).toBe(false);
    }
  });

  it("accepts a null cart from /me or user list payloads", () => {
    const parsed = userSchema.safeParse({
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
      cart: null,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.cart).toBeNull();
    }
  });

  it("rejects a payload without role fields", () => {
    const parsed = userSchema.safeParse({
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
    });

    expect(parsed.success).toBe(false);
  });
});
