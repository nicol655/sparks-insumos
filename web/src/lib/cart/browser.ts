import type { Locale } from "@/i18n/locales";
import type { CartDeleteResult, CartMutationResult } from "@/lib/auth/actions";
import { cartSchema, type Cart, type CartWrite } from "@/lib/auth/contract";
import type { SessionCartLoadResult } from "@/lib/cart/hydrate-session";
import type { CartItem, ResolvedCart } from "@/lib/cart/store";

/**
 * Browser → Next JSON proxies for cart (not server actions).
 * Upstream status/body stay visible in DevTools Preview.
 */

function failureFromStatus(status: number, payload: unknown): CartMutationResult {
  const code =
    payload !== null &&
    typeof payload === "object" &&
    "code" in payload &&
    typeof (payload as { code: unknown }).code === "string"
      ? (payload as { code: string }).code
      : "";

  if (status === 409 || code === "conflict") return { ok: false, code: "conflict" };
  if (status === 404 || code === "not_found") return { ok: false, code: "not_found" };
  return { ok: false, code: "unavailable" };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function mutate(method: "POST" | "PUT", body: CartWrite): Promise<CartMutationResult> {
  let response: Response;
  try {
    response = await fetch("/api/cart", {
      method,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, code: "unavailable" };
  }

  const payload = await readJson(response);
  if (!response.ok) return failureFromStatus(response.status, payload);

  const parsed = cartSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, code: "unavailable" };
  return { ok: true, cart: parsed.data };
}

export async function createCart(body: CartWrite): Promise<CartMutationResult> {
  return mutate("POST", body);
}

export async function replaceCart(body: CartWrite): Promise<CartMutationResult> {
  return mutate("PUT", body);
}

export async function deleteCart(): Promise<CartDeleteResult> {
  let response: Response;
  try {
    response = await fetch("/api/cart", {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
  } catch {
    return { ok: false, code: "unavailable" };
  }

  if (response.status === 204) return { ok: true };
  const payload = await readJson(response);
  if (response.status === 404) return { ok: false, code: "not_found" };
  void payload;
  return { ok: false, code: "unavailable" };
}

export async function resolveCartLines(items: CartItem[], locale: Locale): Promise<ResolvedCart> {
  const response = await fetch("/api/cart/resolve", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ items, locale }),
  });
  if (!response.ok) {
    throw new Error(`cart resolve failed: ${response.status}`);
  }
  return (await response.json()) as ResolvedCart;
}

export async function loadSessionCart(): Promise<SessionCartLoadResult> {
  let response: Response;
  try {
    response = await fetch("/api/me", { headers: { Accept: "application/json" } });
  } catch {
    return { ok: false, code: "unavailable" };
  }

  if (response.status === 401) return { ok: false, code: "unauthorized" };

  const payload = await readJson(response);
  if (
    response.ok &&
    payload !== null &&
    typeof payload === "object" &&
    "signedIn" in payload &&
    (payload as { signedIn: unknown }).signedIn === false
  ) {
    return { ok: true, signedIn: false };
  }

  if (!response.ok) return { ok: false, code: "unavailable" };

  const cart =
    payload !== null && typeof payload === "object" && "cart" in payload
      ? ((payload as { cart: Cart | null }).cart ?? null)
      : null;
  return { ok: true, signedIn: true, cart };
}
