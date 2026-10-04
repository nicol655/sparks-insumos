import { env } from "@/lib/env";
import { CATALOG_TOKEN_HEADER } from "@/lib/catalog/token-header";
import { SESSION_DETAIL, UNAVAILABLE_DETAIL } from "@/lib/users/labels";

function json(body: { code: string; detail: string }, status: number): Response {
  return Response.json(body, { status });
}

function bearerFrom(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (/^Bearer\s+\S+$/i.test(authorization)) return authorization;
  const token = request.headers.get(CATALOG_TOKEN_HEADER)?.trim() ?? "";
  if (!token || /\s/.test(token)) return null;
  return `Bearer ${token}`;
}

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function forward(
  request: Request,
  target: string,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const authorization = bearerFrom(request);
  if (!authorization) return json({ code: "not_authenticated", detail: SESSION_DETAIL }, 401);

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: authorization,
  };
  const contentType = request.headers.get("content-type");
  if (request.method !== "GET" && contentType) headers["Content-Type"] = contentType;

  let upstream: Response;
  try {
    upstream = await fetchImpl(target, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.arrayBuffer(),
    });
  } catch {
    return json({ code: "unavailable", detail: UNAVAILABLE_DETAIL }, 502);
  }

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);
  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
}

export async function forwardUsers(
  request: Request,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "POST") {
    return json({ code: "not_found", detail: "No existe esa ruta." }, 404);
  }
  const target = new URL("/users", `${env.API_BASE_URL}/`);
  target.search = new URL(request.url).search;
  return forward(request, target.toString(), fetchImpl);
}

export async function forwardUserPatch(
  request: Request,
  userId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (!USER_ID.test(userId)) return json({ code: "not_found", detail: "No existe esa ruta." }, 404);
  return forward(request, `${env.API_BASE_URL}/users/${userId}`, fetchImpl);
}
