import { describe, expect, it } from "vitest";

import {
  cartSchema,
  cartWriteSchema,
  loginRequestSchema,
  registerRequestSchema,
  userPatchSchema,
  userPublicSchema,
  type Cart,
  type CartWrite,
  type LoginRequest,
  type RegisterRequest,
  type UserPatch,
  type UserPublic,
} from "@/lib/auth/contract";

const USER_ID = "6b1e2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e";
const ROLE_ID = "11111111-1111-4111-8111-111111111111";
const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";
const CART_ID = "33333333-3333-4333-8333-333333333333";
const TIMESTAMP = "2026-09-25T12:00:00Z";

const registerBody: RegisterRequest = {
  first_name: "Camila",
  last_name: "Ferrari",
  email: "camila@mail.com",
  password: "Sparks1!",
  password_confirmation: "Sparks1!",
  phone: "+5491168692694",
  accept_terms: true,
};

const publicUser: UserPublic = {
  id: USER_ID,
  first_name: "Camila",
  last_name: "Ferrari",
  email: "camila@mail.com",
  phone: "+5491168692694",
  active: true,
  must_change_password: false,
  is_super_admin: false,
  terms_accepted_at: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  role_id: ROLE_ID,
  role: "customer",
  cart: null,
};

const cart: Cart = {
  id: CART_ID,
  user_id: USER_ID,
  items: [{ product_id: PRODUCT_ID, quantity: 5 }],
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
};

describe("auth contract", () => {
  it("accepts a login body of email and password", () => {
    const body: LoginRequest = { email: "camila@mail.com", password: "Sparks1!" };

    expect(loginRequestSchema.parse(body)).toEqual(body);
  });

  it("rejects a login body with an extra key", () => {
    expect(loginRequestSchema.safeParse({ ...registerBody, token: "nope" }).success).toBe(false);
  });

  it("accepts a register body with the seven API fields", () => {
    expect(registerRequestSchema.parse(registerBody)).toEqual(registerBody);
    expect(Object.keys(registerRequestSchema.shape)).toEqual([
      "first_name",
      "last_name",
      "email",
      "password",
      "password_confirmation",
      "phone",
      "accept_terms",
    ]);
  });

  it("rejects register when terms are not accepted or a field is missing", () => {
    expect(registerRequestSchema.safeParse({ ...registerBody, accept_terms: false }).success).toBe(
      false,
    );
    const { phone: _phone, ...withoutPhone } = registerBody;
    expect(_phone).toBe(registerBody.phone);
    expect(registerRequestSchema.safeParse(withoutPhone).success).toBe(false);
  });

  it("accepts a patch of the four editable fields", () => {
    const patch: UserPatch = {
      first_name: "Camila",
      last_name: "Ferrari",
      email: "camila@mail.com",
      phone: "+5491168692694",
    };

    expect(userPatchSchema.parse(patch)).toEqual(patch);
    expect(Object.keys(userPatchSchema.shape).sort()).toEqual([
      "email",
      "first_name",
      "last_name",
      "phone",
    ]);
  });

  it("rejects a patch that carries a password or any other extra key", () => {
    const patch = {
      first_name: "Camila",
      last_name: "Ferrari",
      email: "camila@mail.com",
      phone: "+5491168692694",
      password: "Sparks1!",
    };

    expect(userPatchSchema.safeParse(patch).success).toBe(false);
    expect(userPatchSchema.safeParse({ ...patch, password: undefined, active: false }).success).toBe(
      false,
    );
  });

  it("accepts the public user with role and null cart and refuses password material", () => {
    expect(userPublicSchema.parse(publicUser)).toEqual(publicUser);
    expect(
      userPublicSchema.parse({
        ...publicUser,
        cart,
        permissions: [{ controller: "cart", method: "create" }],
      }).cart?.items[0]?.quantity,
    ).toBe(5);
    expect(userPublicSchema.safeParse({ ...publicUser, password: "Sparks1!" }).success).toBe(false);
    expect(userPublicSchema.safeParse({ ...publicUser, password_hash: "argon" }).success).toBe(
      false,
    );
  });

  it("accepts cart write and public cart payloads", () => {
    const write: CartWrite = { items: [{ product_id: PRODUCT_ID, quantity: 2 }] };
    expect(cartWriteSchema.parse(write)).toEqual(write);
    expect(cartSchema.parse(cart)).toEqual(cart);
    expect(cartWriteSchema.safeParse({ items: [{ product_id: PRODUCT_ID, quantity: 0 }] }).success).toBe(
      false,
    );
  });
});
