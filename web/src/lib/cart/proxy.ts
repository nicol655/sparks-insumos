import { cookies } from "next/headers";

import type { Locale } from "@/i18n/locales";
import { catalogRepository } from "@/lib/api";
import { cartWriteSchema } from "@/lib/auth/contract";
import {
  clearSession,
  readToken,
  SESSION_COOKIE,
  type SessionCookieJar,
} from "@/lib/auth/session";
import { env } from "@/lib/env";
import { resolveCart, type CartItem, type ResolvedCart } from "@/lib/cart/store";

const UNAVAILABLE = { code: "unavailable", detail: "No pudimos hablar con el servidor." };
const NOT_AUTH = { code: "not_authenticated", detail: "No autenticado" };
const INVALID_BODY = { code: "invalid_body", detail: "Cuerpo inválido." };

function json(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

async function cookieJar(): Promise<SessionCookieJar> {
  const store = await cookies();
  return {
    set(name, value, options) {
      store.set(name, value, options);
    },
    get(name) {
      const found = store.get(name);
      return found ? { value: found.value } : undefined;
    },
    delete(name) {
      store.delete(name);
    },
  };
}

function tokenFromCookieHeader(header: string | null): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) {
      const value = rest.join("=");
      return value ? decodeURIComponent(value) : undefined;
    }
  }
  return undefined;
}

async function sessionToken(request: Request): Promise<string | undefined> {
  return tokenFromCookieHeader(request.headers.get("cookie")) ?? readToken(await cookieJar());
}

async function clearSessionCookies(): Promise<void> {
  clearSession(await cookieJar());
}

/**
 * Forwards POST/PUT/DELETE `/api/cart` → `{API_BASE_URL}/carts` with the
 * httpOnly session cookie as Bearer. Propagates upstream status + JSON
 * (same debugging model as the backoffice login proxy).
 */
export async function forwardCart(
  request: Request,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const method = request.method.toUpperCase();
  if (method !== "POST" && method !== "PUT" && method !== "DELETE") {
    return json({ code: "not_found", detail: "No existe esa ruta." }, 404);
  }

  if (!env.API_BASE_URL) return json(UNAVAILABLE, 502);

  const token = await sessionToken(request);
  if (!token) return json(NOT_AUTH, 401);

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  let body: string | undefined;
  if (method === "POST" || method === "PUT") {
    try {
      const payload = cartWriteSchema.parse(await request.json());
      body = JSON.stringify(payload);
      headers["Content-Type"] = "application/json";
    } catch {
      return json(INVALID_BODY, 400);
    }
  }

  let upstream: Response;
  try {
    upstream = await fetchImpl(new URL("/carts", `${env.API_BASE_URL}/`).toString(), {
      method,
      headers,
      body,
    });
  } catch {
    return json(UNAVAILABLE, 502);
  }

  if (upstream.status === 401) {
    await clearSessionCookies();
  }

  if (upstream.status === 204) {
    return new Response(null, { status: 204 });
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

/**
 * GET `/api/me` → upstream `/me` (cookie → Bearer). Used to hydrate the
 * signed-in cart without a Flight payload.
 */
export async function forwardMe(
  request: Request,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (request.method.toUpperCase() !== "GET") {
    return json({ code: "not_found", detail: "No existe esa ruta." }, 404);
  }

  if (!env.API_BASE_URL) return json(UNAVAILABLE, 502);

  const token = await sessionToken(request);
  if (!token) return json({ ok: true, signedIn: false }, 200);

  let upstream: Response;
  try {
    upstream = await fetchImpl(new URL("/me", `${env.API_BASE_URL}/`).toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return json(UNAVAILABLE, 502);
  }

  if (upstream.status === 401) {
    await clearSessionCookies();
    return json({ code: "not_authenticated", detail: NOT_AUTH.detail }, 401);
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type ResolveBody = { items: CartItem[]; locale: Locale };

/**
 * POST `/api/cart/resolve` joins cart refs with the catalogue on the server
 * and returns plain JSON (no server-action Flight).
 */
export async function resolveCartRequest(request: Request): Promise<Response> {
  if (request.method.toUpperCase() !== "POST") {
    return json({ code: "not_found", detail: "No existe esa ruta." }, 404);
  }

  let payload: ResolveBody;
  try {
    payload = (await request.json()) as ResolveBody;
    if (
      !payload ||
      !Array.isArray(payload.items) ||
      (payload.locale !== "es" && payload.locale !== "en")
    ) {
      return json(INVALID_BODY, 400);
    }
  } catch {
    return json(INVALID_BODY, 400);
  }

  const cart: ResolvedCart = await resolveCart(
    payload.items,
    catalogRepository(),
    payload.locale,
  );
  return json(cart, 200);
}
