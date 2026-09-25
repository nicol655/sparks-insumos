import { z } from "zod";

import {
  tokenResponseSchema,
  userPatchSchema,
  userPublicSchema,
  type TokenResponse,
  type UserPatch,
  type UserPublic,
} from "@/lib/auth/contract";
import type { RegisterInput } from "@/lib/auth/validate";

/**
 * HTTP boundary for account calls (spec 008).
 *
 * Failures stay as codes. The token and the request body are never logged.
 */

const TIMEOUT_MS = 10_000;

export type AuthFailureCode =
  | "invalid_credentials"
  | "password_change_required"
  | "email_taken"
  | "contract"
  | "unavailable";

export type AuthFailure = {
  ok: false;
  status: number;
  code: AuthFailureCode;
};

export type AuthSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

export type AuthResult<T> = AuthSuccess<T> | AuthFailure;

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthClient = {
  register(input: RegisterInput): Promise<AuthResult<UserPublic>>;
  login(input: LoginInput): Promise<AuthResult<TokenResponse>>;
  logout(token: string): Promise<AuthResult<void>>;
  getMe(token: string): Promise<AuthResult<UserPublic>>;
  patchMe(token: string, patch: UserPatch): Promise<AuthResult<UserPublic>>;
  deleteMe(token: string): Promise<AuthResult<void>>;
};

type Call = {
  path: string;
  method: string;
  token?: string;
  body?: unknown;
};

function unavailable(): AuthFailure {
  return { ok: false, status: 0, code: "unavailable" };
}

function failureFromStatus(status: number, payload: unknown): AuthFailure {
  const code =
    payload !== null &&
    typeof payload === "object" &&
    "code" in payload &&
    typeof payload.code === "string"
      ? payload.code
      : "";

  if (status === 401) return { ok: false, status, code: "invalid_credentials" };
  if (status === 403 && code === "password_change_required") {
    return { ok: false, status, code: "password_change_required" };
  }
  if (status === 409 && code === "email_taken") return { ok: false, status, code: "email_taken" };
  return { ok: false, status, code: "unavailable" };
}

function registerBody(input: RegisterInput) {
  return {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    password_confirmation: input.password,
    phone: input.phone.trim(),
    accept_terms: true as const,
  };
}

export function createAuthClient(baseUrl: string, fetchImpl: typeof fetch = fetch): AuthClient {
  const root = baseUrl.replace(/\/$/, "");

  async function request<T>(
    call: Call,
    parse: (status: number, payload: unknown) => AuthResult<T>,
  ): Promise<AuthResult<T>> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (call.body !== undefined) headers["Content-Type"] = "application/json";
    if (call.token) headers.Authorization = `Bearer ${call.token}`;

    let response: Response;
    try {
      response = await fetchImpl(`${root}${call.path}`, {
        method: call.method,
        headers,
        body: call.body === undefined ? undefined : JSON.stringify(call.body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      return unavailable();
    }

    if (response.status === 204) {
      return { ok: true, status: 204, data: undefined as T };
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) return failureFromStatus(response.status, payload);
    return parse(response.status, payload);
  }

  function parseJson<T>(schema: z.ZodType<T>, status: number, payload: unknown): AuthResult<T> {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) return { ok: false, status, code: "contract" };
    return { ok: true, status, data: parsed.data };
  }

  return {
    register(input) {
      return request({ path: "/auth/register", method: "POST", body: registerBody(input) }, (status, payload) =>
        parseJson(userPublicSchema, status, payload),
      );
    },
    login(input) {
      return request(
        {
          path: "/auth/login",
          method: "POST",
          body: { email: input.email.trim().toLowerCase(), password: input.password },
        },
        (status, payload) => parseJson(tokenResponseSchema, status, payload),
      );
    },
    logout(token) {
      return request({ path: "/auth/logout", method: "POST", token }, (status) => ({
        ok: true,
        status,
        data: undefined,
      }));
    },
    getMe(token) {
      return request({ path: "/me", method: "GET", token }, (status, payload) =>
        parseJson(userPublicSchema, status, payload),
      );
    },
    patchMe(token, patch) {
      const body = userPatchSchema.parse(patch);
      return request({ path: "/me", method: "PATCH", token, body }, (status, payload) =>
        parseJson(userPublicSchema, status, payload),
      );
    },
    deleteMe(token) {
      return request({ path: "/me", method: "DELETE", token }, (status) => ({
        ok: true,
        status,
        data: undefined,
      }));
    },
  };
}
