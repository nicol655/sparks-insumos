import { z } from "zod";

/**
 * Wire shapes for account calls (spec 008, API 007).
 *
 * Types are inferred from these schemas. Unknown keys are rejected so a
 * password cannot ride along on a profile update or a public user.
 */

const nameSchema = z.string();
const emailSchema = z.string();
const phoneSchema = z.string();
const passwordSchema = z.string();

export const loginRequestSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
});

export const registerRequestSchema = z.strictObject({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  password_confirmation: passwordSchema,
  phone: phoneSchema,
  accept_terms: z.literal(true),
});

/** The four fields `PATCH /me` accepts. Password is not one of them. */
export const userPatchSchema = z.strictObject({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
});

export const userPublicSchema = z.strictObject({
  id: z.uuid(),
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  active: z.boolean(),
  must_change_password: z.boolean(),
  terms_accepted_at: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type UserPatch = z.infer<typeof userPatchSchema>;
export type UserPublic = z.infer<typeof userPublicSchema>;

export const tokenResponseSchema = z.strictObject({
  access_token: z.string().min(1),
  token_type: z.literal("bearer"),
  must_change_password: z.boolean(),
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;
