import { describe, expect, it, vi } from "vitest";

import { createAuthActions } from "@/lib/auth/actions";
import type { AuthClient, AuthResult } from "@/lib/auth/client";
import type { TokenResponse, UserPatch, UserPublic } from "@/lib/auth/contract";
import {
  SESSION_COOKIE,
  SIGNED_IN_COOKIE,
  type SessionCookieJar,
} from "@/lib/auth/session";
import type { RegisterInput } from "@/lib/auth/validate";

const TOKEN = "opaque-session-token";
const USER: UserPublic = {
  id: "6b1e2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e",
  first_name: "Camila",
  last_name: "Ferrari",
  email: "camila@mail.com",
  phone: "+5491168692694",
  active: true,
  must_change_password: false,
  is_super_admin: false,
  terms_accepted_at: "2026-09-25T12:00:00Z",
  created_at: "2026-09-25T12:00:00Z",
  updated_at: "2026-09-25T12:00:00Z",
  role_id: "11111111-1111-4111-8111-111111111111",
  role: "customer",
  cart: null,
};
const TOKEN_BODY: TokenResponse = {
  access_token: TOKEN,
  token_type: "bearer",
  must_change_password: false,
};
const VALID: RegisterInput = {
  firstName: "Camila",
  lastName: "Ferrari",
  email: "camila@mail.com",
  phone: "+5491168692694",
  password: "Sparks1!",
};

class Redirected extends Error {
  constructor(readonly path: string) {
    super(path);
  }
}

function jar(): SessionCookieJar & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    set(name, value) {
      values.set(name, value);
    },
    get(name) {
      const value = values.get(name);
      return value === undefined ? undefined : { value };
    },
    delete(name) {
      values.delete(name);
    },
  };
}

function client(partial: Partial<AuthClient> = {}): AuthClient {
  const fail = async (): Promise<AuthResult<never>> => ({
    ok: false,
    status: 500,
    code: "unavailable",
  });
  return {
    register: vi.fn(fail),
    login: vi.fn(fail),
    logout: vi.fn(async () => ({ ok: true as const, status: 204, data: undefined })),
    getMe: vi.fn(fail),
    patchMe: vi.fn(fail),
    deleteMe: vi.fn(fail),
    createCart: vi.fn(fail),
    replaceCart: vi.fn(fail),
    deleteCart: vi.fn(fail),
    ...partial,
  };
}

function setup(auth: AuthClient, cookies = jar()) {
  const redirect = (path: string): never => {
    throw new Redirected(path);
  };
  const actions = createAuthActions({
    client: auth,
    cookies,
    redirect,
    secure: false,
    locale: "es",
  });
  return { actions, cookies, redirect };
}

async function pathOf(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof Redirected) return error.path;
    throw error;
  }
  throw new Error("expected a redirect");
}

describe("auth actions", () => {
  it("stores the session and redirects to a safe next path after login", async () => {
    const getMe = vi.fn(async () => ({ ok: true as const, status: 200, data: USER }));
    const auth = client({
      login: vi.fn(async () => ({ ok: true as const, status: 200, data: TOKEN_BODY })),
      getMe,
    });
    const { actions, cookies } = setup(auth);

    await expect(pathOf(() => actions.login({ ...VALID, next: "/es/catalogo?q=oud" }))).resolves.toBe(
      "/es/catalogo?q=oud",
    );
    expect(cookies.get(SESSION_COOKIE)?.value).toBe(TOKEN);
    expect(cookies.get(SIGNED_IN_COOKIE)?.value).toBe("1");
    expect(getMe).toHaveBeenCalledWith(TOKEN);
  });

  it("keeps the session when the token asks for a password change", async () => {
    const auth = client({
      login: vi.fn(async () => ({
        ok: true as const,
        status: 200,
        data: { ...TOKEN_BODY, must_change_password: true },
      })),
      getMe: vi.fn(async () => ({ ok: true as const, status: 200, data: USER })),
    });
    const { actions, cookies } = setup(auth);

    await expect(pathOf(() => actions.login({ ...VALID, next: null }))).resolves.toBe("/es/catalogo");
    expect(cookies.get(SESSION_COOKIE)?.value).toBe(TOKEN);
  });

  it("sends a hostile next to the catalogue and does not keep a cookie on 401 or 500", async () => {
    const denied = client({
      login: vi.fn(async () => ({
        ok: false as const,
        status: 401,
        code: "invalid_credentials" as const,
      })),
    });
    const { actions, cookies } = setup(denied);
    await expect(actions.login({ ...VALID, next: "/es/cuenta" })).resolves.toEqual({
      ok: false,
      code: "invalid_credentials",
    });
    expect(cookies.values.size).toBe(0);

    const down = client();
    const failed = setup(down);
    await expect(failed.actions.login({ ...VALID, next: null })).resolves.toEqual({
      ok: false,
      code: "unavailable",
    });
    expect(failed.cookies.values.size).toBe(0);

    const hostile = client({
      login: vi.fn(async () => ({ ok: true as const, status: 200, data: TOKEN_BODY })),
      getMe: vi.fn(async () => ({ ok: true as const, status: 200, data: USER })),
    });
    const { actions: signedIn } = setup(hostile);
    await expect(pathOf(() => signedIn.login({ ...VALID, next: "https://evil.example" }))).resolves.toBe(
      "/es/catalogo",
    );
  });

  it("clears the session when post-login /me returns 401", async () => {
    const auth = client({
      login: vi.fn(async () => ({ ok: true as const, status: 200, data: TOKEN_BODY })),
      getMe: vi.fn(async () => ({
        ok: false as const,
        status: 401,
        code: "invalid_credentials" as const,
      })),
    });
    const { actions, cookies } = setup(auth);

    await expect(actions.login({ ...VALID, next: null })).resolves.toEqual({
      ok: false,
      code: "unavailable",
    });
    expect(cookies.values.size).toBe(0);
  });

  it("does not call the API when registration fails validation", async () => {
    const auth = client();
    const { actions } = setup(auth);

    await expect(actions.register({ ...VALID, firstName: " " })).resolves.toEqual({
      ok: false,
      code: "first_name",
    });
    expect(auth.register).not.toHaveBeenCalled();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("signs in after a 201 and opens the account page", async () => {
    const getMe = vi.fn(async () => ({ ok: true as const, status: 200, data: USER }));
    const auth = client({
      register: vi.fn(async () => ({ ok: true as const, status: 201, data: USER })),
      login: vi.fn(async () => ({ ok: true as const, status: 200, data: TOKEN_BODY })),
      getMe,
    });
    const { actions, cookies } = setup(auth);

    await expect(pathOf(() => actions.register(VALID))).resolves.toBe("/es/cuenta");
    expect(cookies.get(SESSION_COOKIE)?.value).toBe(TOKEN);
    expect(auth.login).toHaveBeenCalledWith({ email: VALID.email, password: VALID.password });
    expect(getMe).toHaveBeenCalledWith(TOKEN);
  });

  it("sends the shopper to sign in when the courtesy login fails, without a cookie", async () => {
    const auth = client({
      register: vi.fn(async () => ({ ok: true as const, status: 201, data: USER })),
      login: vi.fn(async () => ({
        ok: false as const,
        status: 401,
        code: "invalid_credentials" as const,
      })),
    });
    const { actions, cookies } = setup(auth);

    await expect(pathOf(() => actions.register(VALID))).resolves.toBe(
      "/es/ingresar?next=%2Fes%2Fcuenta",
    );
    expect(cookies.values.size).toBe(0);
  });

  it("returns email_taken and does not log in when register is 409", async () => {
    const auth = client({
      register: vi.fn(async () => ({ ok: false as const, status: 409, code: "email_taken" as const })),
    });
    const { actions } = setup(auth);

    await expect(actions.register(VALID)).resolves.toEqual({ ok: false, code: "email_taken" });
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("clears the session and opens the catalogue even when logout fails", async () => {
    const thrown = client({
      logout: vi.fn(async () => {
        throw new Error("down");
      }),
    });
    const first = setup(thrown);
    first.cookies.set(SESSION_COOKIE, TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1,
      secure: false,
    });
    await expect(pathOf(() => first.actions.logout())).resolves.toBe("/es/catalogo");
    expect(first.cookies.get(SESSION_COOKIE)).toBeUndefined();

    const failed = client({
      logout: vi.fn(async () => ({ ok: false as const, status: 500, code: "unavailable" as const })),
    });
    const second = setup(failed);
    second.cookies.set(SESSION_COOKIE, TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1,
      secure: false,
    });
    await expect(pathOf(() => second.actions.logout())).resolves.toBe("/es/catalogo");
    expect(second.cookies.values.size).toBe(0);
  });

  it("refuses a filled password without calling patch, and updates on a valid save", async () => {
    const auth = client();
    const blocked = setup(auth);
    await expect(blocked.actions.patchMe(VALID)).resolves.toEqual({
      ok: false,
      code: "password_unchanged_here",
    });
    expect(auth.patchMe).not.toHaveBeenCalled();

    const updated = { ...USER, first_name: "Ana" };
    const saving = client({
      patchMe: vi.fn(async (_token: string, patch: UserPatch) => {
        expect(Object.keys(patch).sort()).toEqual(["email", "first_name", "last_name", "phone"]);
        return { ok: true as const, status: 200, data: updated };
      }),
    });
    const { actions, cookies } = setup(saving);
    cookies.set(SESSION_COOKIE, TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1,
      secure: false,
    });
    await expect(actions.patchMe({ ...VALID, password: "" })).resolves.toEqual({
      ok: true,
      user: updated,
    });
  });

  it("keeps the drawer open when the new email is taken", async () => {
    const auth = client({
      patchMe: vi.fn(async () => ({ ok: false as const, status: 409, code: "email_taken" as const })),
    });
    const { actions, cookies } = setup(auth);
    cookies.set(SESSION_COOKIE, TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1,
      secure: false,
    });

    await expect(actions.patchMe({ ...VALID, password: "" })).resolves.toEqual({
      ok: false,
      code: "email_taken",
    });
  });

  it("clears the session after delete and leaves it when delete fails", async () => {
    const ok = client({
      deleteMe: vi.fn(async () => ({ ok: true as const, status: 204, data: undefined })),
    });
    const deleted = setup(ok);
    deleted.cookies.set(SESSION_COOKIE, TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1,
      secure: false,
    });
    await expect(pathOf(() => deleted.actions.deleteAccount())).resolves.toBe("/es/catalogo");
    expect(deleted.cookies.values.size).toBe(0);

    const failed = client({
      deleteMe: vi.fn(async () => ({ ok: false as const, status: 500, code: "unavailable" as const })),
    });
    const kept = setup(failed);
    kept.cookies.set(SESSION_COOKIE, TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1,
      secure: false,
    });
    await expect(kept.actions.deleteAccount()).resolves.toEqual({ ok: false, code: "delete_failed" });
    expect(kept.cookies.get(SESSION_COOKIE)?.value).toBe(TOKEN);
  });

  it("clears a rejected session and sends the shopper back to sign in", async () => {
    const auth = client({
      getMe: vi.fn(async () => ({
        ok: false as const,
        status: 401,
        code: "invalid_credentials" as const,
      })),
    });
    const { actions, cookies } = setup(auth);
    cookies.set(SESSION_COOKIE, TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1,
      secure: false,
    });

    await expect(pathOf(() => actions.loadAccount())).resolves.toBe("/es/ingresar?next=%2Fes%2Fcuenta");
    expect(cookies.values.size).toBe(0);
  });

  it("loads the session cart for chrome hydration", async () => {
    const withCart = {
      ...USER,
      cart: {
        id: "33333333-3333-4333-8333-333333333333",
        user_id: USER.id,
        items: [{ product_id: "22222222-2222-4222-8222-222222222222", quantity: 4 }],
        created_at: "2026-09-25T12:00:00Z",
        updated_at: "2026-09-25T12:00:00Z",
      },
    };
    const auth = client({
      getMe: vi.fn(async () => ({ ok: true as const, status: 200, data: withCart })),
    });
    const { actions, cookies } = setup(auth);
    cookies.set(SESSION_COOKIE, TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1,
      secure: false,
    });

    await expect(actions.loadSessionCart()).resolves.toEqual({
      ok: true,
      signedIn: true,
      cart: withCart.cart,
    });

    const guest = setup(client());
    await expect(guest.actions.loadSessionCart()).resolves.toEqual({ ok: true, signedIn: false });
  });

  it("creates and replaces the cart through the session token", async () => {
    const cart = {
      id: "33333333-3333-4333-8333-333333333333",
      user_id: USER.id,
      items: [{ product_id: "22222222-2222-4222-8222-222222222222", quantity: 2 }],
      created_at: "2026-09-25T12:00:00Z",
      updated_at: "2026-09-25T12:00:00Z",
    };
    const body = { items: cart.items };
    const auth = client({
      createCart: vi.fn(async () => ({ ok: true as const, status: 201, data: cart })),
      replaceCart: vi.fn(async () => ({ ok: true as const, status: 200, data: cart })),
      deleteCart: vi.fn(async () => ({ ok: true as const, status: 204, data: undefined })),
    });
    const { actions, cookies } = setup(auth);
    cookies.set(SESSION_COOKIE, TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1,
      secure: false,
    });

    await expect(actions.createCart(body)).resolves.toEqual({ ok: true, cart });
    await expect(actions.replaceCart(body)).resolves.toEqual({ ok: true, cart });
    await expect(actions.deleteCart()).resolves.toEqual({ ok: true });
    expect(auth.createCart).toHaveBeenCalledWith(TOKEN, body);
    expect(auth.replaceCart).toHaveBeenCalledWith(TOKEN, body);
    expect(auth.deleteCart).toHaveBeenCalledWith(TOKEN);
  });
});
