import type { Locale } from "@/i18n/locales";
import type { AuthClient, AuthResult } from "@/lib/auth/client";
import type { UserPublic } from "@/lib/auth/contract";
import { accountPath, catalogPath, safeNext, signInPath } from "@/lib/auth/return-to";
import { clearSession, readToken, setSession, type SessionCookieJar } from "@/lib/auth/session";
import {
  validateProfile,
  validateRegister,
  type ProfileInput,
  type RegisterInput,
} from "@/lib/auth/validate";

/**
 * Account actions without Next.js (spec 008).
 *
 * Cookies, the HTTP client and redirect are injected so the tests never boot
 * the framework. A successful login or logout redirects instead of returning.
 */

export type ActionCode =
  | "invalid_credentials"
  | "unavailable"
  | "email_taken"
  | "password_unchanged_here"
  | "password_change_required"
  | "delete_failed"
  | "first_name"
  | "last_name"
  | "email"
  | "phone"
  | "password";

export type ActionFailure = {
  ok: false;
  code: ActionCode;
};

export type LoginActionInput = {
  email: string;
  password: string;
  next: string | null;
};

export type AuthActions = {
  login(input: LoginActionInput): Promise<ActionFailure>;
  register(input: RegisterInput): Promise<ActionFailure>;
  logout(): Promise<ActionFailure>;
  patchMe(input: ProfileInput): Promise<ActionFailure | { ok: true; user: UserPublic }>;
  deleteAccount(): Promise<ActionFailure>;
  loadAccount(): Promise<{ ok: true; user: UserPublic } | ActionFailure>;
};

export type AuthActionDeps = {
  client: AuthClient;
  cookies: SessionCookieJar;
  redirect: (path: string) => never;
  secure: boolean;
  locale: Locale;
};

function signInWithAccountNext(locale: Locale): string {
  return `${signInPath(locale)}?next=${encodeURIComponent(accountPath(locale))}`;
}

export function createAuthActions(deps: AuthActionDeps): AuthActions {
  const { client, cookies, redirect, secure, locale } = deps;

  return {
    async login(input) {
      const result = await client.login({ email: input.email, password: input.password });
      if (!result.ok) {
        return {
          ok: false,
          code: result.code === "invalid_credentials" ? "invalid_credentials" : "unavailable",
        };
      }
      setSession(cookies, result.data.access_token, secure);
      return redirect(safeNext(input.next, locale));
    },

    async register(input) {
      const issue = validateRegister(input);
      if (issue) return { ok: false, code: issue };

      const created = await client.register(input);
      if (!created.ok) {
        return { ok: false, code: created.code === "email_taken" ? "email_taken" : "unavailable" };
      }

      const signedIn = await client.login({ email: input.email, password: input.password });
      if (!signedIn.ok) return redirect(signInWithAccountNext(locale));

      setSession(cookies, signedIn.data.access_token, secure);
      return redirect(accountPath(locale));
    },

    async logout() {
      const token = readToken(cookies);
      if (token) {
        try {
          await client.logout(token);
        } catch {
          // The cookie goes away even when the API cannot be reached.
        }
      }
      clearSession(cookies);
      return redirect(catalogPath(locale));
    },

    async patchMe(input) {
      const issue = validateProfile(input);
      if (issue) return { ok: false, code: issue };

      const token = readToken(cookies);
      if (!token) return { ok: false, code: "unavailable" };

      const result = await client.patchMe(token, {
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
      });
      if (!result.ok) {
        return { ok: false, code: result.code === "email_taken" ? "email_taken" : "unavailable" };
      }
      return { ok: true, user: result.data };
    },

    async deleteAccount() {
      const token = readToken(cookies);
      if (!token) return { ok: false, code: "delete_failed" };

      let result: AuthResult<void>;
      try {
        result = await client.deleteMe(token);
      } catch {
        return { ok: false, code: "delete_failed" };
      }
      if (!result.ok) return { ok: false, code: "delete_failed" };

      clearSession(cookies);
      return redirect(catalogPath(locale));
    },

    async loadAccount() {
      const token = readToken(cookies);
      if (!token) return redirect(signInWithAccountNext(locale));

      const result = await client.getMe(token);
      if (!result.ok && result.status === 401) {
        clearSession(cookies);
        return redirect(signInWithAccountNext(locale));
      }
      if (!result.ok && result.code === "password_change_required") {
        return { ok: false, code: "password_change_required" };
      }
      if (!result.ok) return { ok: false, code: "unavailable" };
      return { ok: true, user: result.data };
    },
  };
}
