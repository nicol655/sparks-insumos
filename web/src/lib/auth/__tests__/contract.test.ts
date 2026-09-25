import { describe, expect, it } from "vitest";

import {
  loginRequestSchema,
  registerRequestSchema,
  userPatchSchema,
  userPublicSchema,
  type LoginRequest,
  type RegisterRequest,
  type UserPatch,
  type UserPublic,
} from "@/lib/auth/contract";

const USER_ID = "6b1e2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e";
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
  terms_accepted_at: TIMESTAMP,
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

  it("accepts the public user and refuses password material", () => {
    expect(userPublicSchema.parse(publicUser)).toEqual(publicUser);
    expect(userPublicSchema.safeParse({ ...publicUser, password: "Sparks1!" }).success).toBe(false);
    expect(userPublicSchema.safeParse({ ...publicUser, password_hash: "argon" }).success).toBe(
      false,
    );
  });
});
