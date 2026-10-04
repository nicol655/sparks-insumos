import { z } from "zod";

const emailSchema = z.string();
const passwordSchema = z.string();

export const loginRequestSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
});

export const tokenResponseSchema = z.strictObject({
  access_token: z.string().min(1),
  token_type: z.literal("bearer"),
  must_change_password: z.boolean(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
