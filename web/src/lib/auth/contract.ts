import { z } from "zod";

/**
 * Wire shapes for account and cart calls (specs 008 / 021, API 007+).
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

export const permissionGrantSchema = z.strictObject({
  controller: z.string().min(1),
  method: z.string().nullable(),
});

export const cartItemSchema = z.strictObject({
  product_id: z.uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const cartSchema = z.strictObject({
  id: z.uuid(),
  user_id: z.uuid(),
  items: z.array(cartItemSchema),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

/** Body for `POST /carts` and `PUT /carts`. */
export const cartWriteSchema = z.strictObject({
  items: z.array(cartItemSchema),
});

export const userPublicSchema = z.strictObject({
  id: z.uuid(),
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  active: z.boolean(),
  must_change_password: z.boolean(),
  is_super_admin: z.boolean(),
  terms_accepted_at: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  role_id: z.uuid(),
  role: z.string().min(1),
  permissions: z.array(permissionGrantSchema).nullable().optional(),
  cart: cartSchema.nullable().optional(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type UserPatch = z.infer<typeof userPatchSchema>;
export type UserPublic = z.infer<typeof userPublicSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type CartWrite = z.infer<typeof cartWriteSchema>;
export type PermissionGrant = z.infer<typeof permissionGrantSchema>;

export const tokenResponseSchema = z.strictObject({
  access_token: z.string().min(1),
  token_type: z.literal("bearer"),
  must_change_password: z.boolean(),
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;
