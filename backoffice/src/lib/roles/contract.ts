import { z } from "zod";

const timestamp = z.string().min(1);

export const permissionSchema = z.strictObject({
  id: z.uuid(),
  controller: z.string().min(1),
  method: z.string().nullable(),
  created_at: timestamp,
  updated_at: timestamp,
});

export const roleSchema = z.strictObject({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  created_at: timestamp,
  updated_at: timestamp,
  permission_ids: z.array(z.uuid()),
});

export const roleStatisticsSchema = z.strictObject({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  created_at: timestamp,
  updated_at: timestamp,
  permission_ids: z.array(z.uuid()),
  permissions_count: z.number().int().nonnegative(),
  users_count: z.number().int().nonnegative(),
  locked: z.boolean(),
  has_backoffice_access: z.boolean(),
});

export type PermissionRow = z.infer<typeof permissionSchema>;
export type RoleRow = z.infer<typeof roleSchema>;
export type RoleStatistics = z.infer<typeof roleStatisticsSchema>;
