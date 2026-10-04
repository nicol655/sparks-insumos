import { env } from "@/lib/env";

const UNAVAILABLE = "No pudimos iniciar sesión. Intentá de nuevo.";

function json(body: { code: string; detail: string }, status: number): Response {
  return Response.json(body, { status });
}

export async function forwardLogin(
  request: Request,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "POST") {
    return json({ code: "not_found", detail: "No existe esa ruta." }, 404);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ code: "invalid_body", detail: "Cuerpo inválido." }, 400);
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return json({ code: "invalid_body", detail: "Cuerpo inválido." }, 400);
  }

  const body = {
    ...(payload as Record<string, unknown>),
    location: "backoffice",
  };

  let upstream: Response;
  try {
    upstream = await fetchImpl(new URL("/auth/login", `${env.API_BASE_URL}/`).toString(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return json({ code: "unavailable", detail: UNAVAILABLE }, 502);
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}
