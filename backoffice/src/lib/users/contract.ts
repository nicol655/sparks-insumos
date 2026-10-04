import { z } from "zod";

const timestamp = z.string().min(1);

export const permissionGrantSchema = z.strictObject({
  controller: z.string().min(1),
  method: z.string().nullable(),
});

export const userSchema = z.strictObject({
  id: z.uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string(),
  active: z.boolean(),
  must_change_password: z.boolean(),
  terms_accepted_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp,
  role_id: z.uuid(),
  role: z.string().min(1),
  permissions: z.array(permissionGrantSchema).nullable().optional(),
});

export type Account = z.infer<typeof userSchema>;
export type PermissionGrant = z.infer<typeof permissionGrantSchema>;
