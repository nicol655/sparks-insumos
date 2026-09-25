/**
 * Session cookies for the storefront (ADR-0012).
 *
 * The bearer lives only in the httpOnly cookie. The second cookie is a
 * presence flag the header can read; it never carries the token.
 */

export const SESSION_COOKIE = "sparks_session";
export const SIGNED_IN_COOKIE = "sparks_signed_in";
export const SESSION_MAX_AGE = 21_600;

export type SessionCookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  secure: boolean;
};

/** Subset of the Next cookie store the tests can fake without `next/headers`. */
export type SessionCookieJar = {
  set(name: string, value: string, options: SessionCookieOptions): void;
  get(name: string): { value: string } | undefined;
  delete(name: string): void;
};

function options(httpOnly: boolean, secure: boolean): SessionCookieOptions {
  return {
    httpOnly,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure,
  };
}

export function setSession(jar: SessionCookieJar, token: string, secure: boolean): void {
  jar.set(SESSION_COOKIE, token, options(true, secure));
  jar.set(SIGNED_IN_COOKIE, "1", options(false, secure));
}

export function clearSession(jar: SessionCookieJar): void {
  jar.delete(SESSION_COOKIE);
  jar.delete(SIGNED_IN_COOKIE);
}

export function readToken(jar: SessionCookieJar): string | undefined {
  return jar.get(SESSION_COOKIE)?.value;
}
