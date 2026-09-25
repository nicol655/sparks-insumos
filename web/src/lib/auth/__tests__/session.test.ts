import { describe, expect, it } from "vitest";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  SIGNED_IN_COOKIE,
  clearSession,
  readToken,
  setSession,
  type SessionCookieJar,
  type SessionCookieOptions,
} from "@/lib/auth/session";

type Stored = { value: string; options: SessionCookieOptions };

function createJar(): SessionCookieJar & { stored: Map<string, Stored> } {
  const stored = new Map<string, Stored>();

  return {
    stored,
    set(name, value, options) {
      stored.set(name, { value, options });
    },
    get(name) {
      const found = stored.get(name);
      return found ? { value: found.value } : undefined;
    },
    delete(name) {
      stored.delete(name);
    },
  };
}

const TOKEN = "opaque-token";

describe("session cookies", () => {
  it("stores the bearer as httpOnly and a presence flag without the token", () => {
    const jar = createJar();

    setSession(jar, TOKEN, false);

    const session = jar.stored.get(SESSION_COOKIE);
    const presence = jar.stored.get(SIGNED_IN_COOKIE);

    expect(session).toEqual({
      value: TOKEN,
      options: { httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE, secure: false },
    });
    expect(presence?.value).toBe("1");
    expect(presence?.value).not.toBe(TOKEN);
    expect(presence?.options.httpOnly).toBe(false);
    expect(presence?.options).toMatchObject({
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
      secure: false,
    });
  });

  it("marks both cookies Secure only when asked", () => {
    const jar = createJar();

    setSession(jar, TOKEN, true);

    expect(jar.stored.get(SESSION_COOKIE)?.options.secure).toBe(true);
    expect(jar.stored.get(SIGNED_IN_COOKIE)?.options.secure).toBe(true);
  });

  it("reads only the httpOnly session cookie", () => {
    const jar = createJar();
    jar.set(SIGNED_IN_COOKIE, TOKEN, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
      secure: false,
    });

    expect(readToken(jar)).toBeUndefined();

    setSession(jar, TOKEN, false);

    expect(readToken(jar)).toBe(TOKEN);
  });

  it("clears both cookies", () => {
    const jar = createJar();
    setSession(jar, TOKEN, false);

    clearSession(jar);

    expect(jar.get(SESSION_COOKIE)).toBeUndefined();
    expect(jar.get(SIGNED_IN_COOKIE)).toBeUndefined();
    expect(readToken(jar)).toBeUndefined();
  });
});
