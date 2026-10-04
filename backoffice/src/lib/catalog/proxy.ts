import { env } from "@/lib/env";
import { SESSION_DETAIL, UNAVAILABLE_DETAIL } from "@/lib/catalog/labels";
import { CATALOG_TOKEN_HEADER } from "@/lib/catalog/token-header";

// The browser cannot resolve `api`, and the API does not send CORS (ADR-0014, ADR-0019).

export const CATALOG_PATHS = ["/products", "/product-categories", "/tags"] as const;

export type CatalogPath = (typeof CATALOG_PATHS)[number];

function json(body: { code: string; detail: string }, status: number): Response {
  return Response.json(body, { status });
}

export async function forwardCatalog(
  request: Request,
  path: CatalogPath,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (!(CATALOG_PATHS as readonly string[]).includes(path)) {
    return json({ code: "not_found", detail: "No existe esa ruta." }, 404);
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return json({ code: "not_found", detail: "No existe esa ruta." }, 404);
  }

  const authorization = bearerFrom(request);
  if (!authorization) return json({ code: "not_authenticated", detail: SESSION_DETAIL }, 401);

  const target = new URL(path, `${env.API_BASE_URL}/`);
  target.search = new URL(request.url).search;

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: authorization,
  };
  const contentType = request.headers.get("content-type");
  if (request.method === "POST" && contentType) headers["Content-Type"] = contentType;

  let upstream: Response;
  try {
    upstream = await fetchImpl(target.toString(), {
      method: request.method,
      headers,
      body: request.method === "POST" ? await request.arrayBuffer() : undefined,
    });
  } catch {
    return json({ code: "unavailable", detail: UNAVAILABLE_DETAIL }, 502);
  }

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);
  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
}

function bearerFrom(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (/^Bearer\s+\S+$/i.test(authorization)) return authorization;
  const token = request.headers.get(CATALOG_TOKEN_HEADER)?.trim() ?? "";
  if (!token || /\s/.test(token)) return null;
  return `Bearer ${token}`;
}

const PRODUCT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function forwardProductPatch(
  request: Request,
  productId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (!PRODUCT_ID.test(productId)) return json({ code: "not_found", detail: "No existe esa ruta." }, 404);

  const authorization = bearerFrom(request);
  if (!authorization) return json({ code: "not_authenticated", detail: SESSION_DETAIL }, 401);

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: authorization,
  };
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  let upstream: Response;
  try {
    upstream = await fetchImpl(`${env.API_BASE_URL}/products/${productId}`, {
      method: "PATCH",
      headers,
      body: await request.arrayBuffer(),
    });
  } catch {
    return json({ code: "unavailable", detail: UNAVAILABLE_DETAIL }, 502);
  }

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);
  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
}

export function createCatalogHandlers(path: CatalogPath, fetchImpl: typeof fetch = fetch) {
  return {
    GET: (request: Request) => forwardCatalog(request, path, fetchImpl),
    POST: (request: Request) => forwardCatalog(request, path, fetchImpl),
  };
}
