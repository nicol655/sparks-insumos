import { z } from "zod";

import { CATALOG_TOKEN_HEADER } from "@/lib/catalog/token-header";
import {
  permissionSchema,
  roleSchema,
  roleStatisticsSchema,
  type PermissionRow,
  type RoleRow,
  type RoleStatistics,
} from "@/lib/roles/contract";
import type { RoleCreateBody, RolePatchBody, RolePermissionsBody } from "@/lib/roles/form";
import { detailFrom, isUnauthenticated } from "@/lib/users/client";
import { UNAVAILABLE_DETAIL } from "@/lib/users/labels";

const TIMEOUT_MS = 10_000;

export type RolesFailure = {
  ok: false;
  status: number;
  detail: string;
};

export type RoleStatisticsResult = { ok: true; roles: RoleStatistics[] } | RolesFailure;
export type RoleResult = { ok: true; role: RoleRow } | RolesFailure;
export type PermissionsResult = { ok: true; permissions: PermissionRow[] } | RolesFailure;
export type EmptyResult = { ok: true } | RolesFailure;

export type RolesClient = {
  listStatistics(token: string): Promise<RoleStatisticsResult>;
  listPermissions(token: string): Promise<PermissionsResult>;
  createRole(input: RoleCreateBody, token: string): Promise<RoleResult>;
  updateRole(id: string, input: RolePatchBody, token: string): Promise<RoleResult>;
  replacePermissions(
    id: string,
    input: RolePermissionsBody,
    token: string,
  ): Promise<RoleResult>;
  deleteRole(id: string, token: string): Promise<EmptyResult>;
};

export { isUnauthenticated };

type RequestResult = { ok: true; status: number; payload: unknown } | RolesFailure;

async function request(
  fetchImpl: typeof fetch,
  url: string,
  token: string,
  init: { method: string; body?: string },
): Promise<RequestResult> {
  let response: Response;
  try {
    const headers = new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      [CATALOG_TOKEN_HEADER]: token,
    });
    if (init.body !== undefined) headers.set("Content-Type", "application/json");
    response = await fetchImpl(url, {
      method: init.method,
      headers,
      body: init.body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, status: 0, detail: UNAVAILABLE_DETAIL };
  }

  if (response.status === 204) return { ok: true, status: 204, payload: null };

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) return { ok: false, status: response.status, detail: detailFrom(payload) };
  return { ok: true, status: response.status, payload };
}

export function createRolesClient(baseUrl: string, fetchImpl: typeof fetch = fetch): RolesClient {
  const root = baseUrl.replace(/\/$/, "");

  return {
    async listStatistics(token) {
      const result = await request(fetchImpl, `${root}/roles`, token, { method: "GET" });
      if (!result.ok) return result;
      const parsed = z.array(roleStatisticsSchema).safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, roles: parsed.data };
    },
    async listPermissions(token) {
      const result = await request(fetchImpl, `${root}/permissions`, token, { method: "GET" });
      if (!result.ok) return result;
      const parsed = z.array(permissionSchema).safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, permissions: parsed.data };
    },
    async createRole(input, token) {
      const result = await request(fetchImpl, `${root}/roles`, token, {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!result.ok) return result;
      const parsed = roleSchema.safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, role: parsed.data };
    },
    async updateRole(id, input, token) {
      const result = await request(fetchImpl, `${root}/roles/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      if (!result.ok) return result;
      const parsed = roleSchema.safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, role: parsed.data };
    },
    async replacePermissions(id, input, token) {
      const result = await request(fetchImpl, `${root}/roles/${id}/permissions`, token, {
        method: "PUT",
        body: JSON.stringify(input),
      });
      if (!result.ok) return result;
      const parsed = roleSchema.safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, role: parsed.data };
    },
    async deleteRole(id, token) {
      const result = await request(fetchImpl, `${root}/roles/${id}`, token, { method: "DELETE" });
      if (!result.ok) return result;
      return { ok: true };
    },
  };
}
