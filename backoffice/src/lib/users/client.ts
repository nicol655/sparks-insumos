import { z } from "zod";

import { CATALOG_TOKEN_HEADER } from "@/lib/catalog/token-header";
import { userSchema, type Account } from "@/lib/users/contract";
import type { UserCreateBody, UserPatchBody } from "@/lib/users/form";
import { INVALID_DETAIL, UNAVAILABLE_DETAIL } from "@/lib/users/labels";

const TIMEOUT_MS = 10_000;

export type UsersFailure = {
  ok: false;
  status: number;
  detail: string;
};

export type UsersResult = { ok: true; users: Account[] } | UsersFailure;
export type UserResult = { ok: true; user: Account } | UsersFailure;

export type UsersClient = {
  listUsers(token: string): Promise<UsersResult>;
  createUser(input: UserCreateBody, token: string): Promise<UserResult>;
  updateUser(id: string, input: UserPatchBody, token: string): Promise<UserResult>;
};

export function isUnauthenticated(result: { ok: boolean; status?: number }): boolean {
  return result.ok === false && result.status === 401;
}

export function detailFrom(payload: unknown): string {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) return UNAVAILABLE_DETAIL;
  const detail = payload.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) return INVALID_DETAIL;
  return UNAVAILABLE_DETAIL;
}

type RequestResult = { ok: true; status: number; payload: unknown } | UsersFailure;

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

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) return { ok: false, status: response.status, detail: detailFrom(payload) };
  return { ok: true, status: response.status, payload };
}

export function createUsersClient(baseUrl: string, fetchImpl: typeof fetch = fetch): UsersClient {
  const root = baseUrl.replace(/\/$/, "");

  return {
    async listUsers(token) {
      const result = await request(fetchImpl, `${root}/users`, token, { method: "GET" });
      if (!result.ok) return result;
      const parsed = z.array(userSchema).safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, users: parsed.data };
    },
    async createUser(input, token) {
      const result = await request(fetchImpl, `${root}/users`, token, {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!result.ok) return result;
      const parsed = userSchema.safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, user: parsed.data };
    },
    async updateUser(id, input, token) {
      const result = await request(fetchImpl, `${root}/users/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      if (!result.ok) return result;
      const parsed = userSchema.safeParse(result.payload);
      if (!parsed.success) return { ok: false, status: result.status, detail: UNAVAILABLE_DETAIL };
      return { ok: true, user: parsed.data };
    },
  };
}
