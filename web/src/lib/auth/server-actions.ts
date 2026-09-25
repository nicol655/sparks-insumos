"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/locales";
import { createAuthActions, type LoginActionInput } from "@/lib/auth/actions";
import { createAuthClient } from "@/lib/auth/client";
import { accountPath, catalogPath, signInPath } from "@/lib/auth/return-to";
import { clearSession, readToken, type SessionCookieJar } from "@/lib/auth/session";
import type { ProfileInput, RegisterInput } from "@/lib/auth/validate";
import { env } from "@/lib/env";

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

function httpClient() {
  return env.API_BASE_URL ? createAuthClient(env.API_BASE_URL) : null;
}

async function actionsFor(locale: Locale) {
  const client = httpClient();
  if (!client) return null;
  return createAuthActions({
    client,
    cookies: await cookieJar(),
    redirect: (path) => redirect(path),
    secure: process.env.NODE_ENV === "production",
    locale,
  });
}

export async function loginAction(input: LoginActionInput & { locale: Locale }) {
  const actions = await actionsFor(input.locale);
  if (!actions) return { ok: false as const, code: "unavailable" as const };
  return actions.login(input);
}

export async function registerAction(input: RegisterInput & { locale: Locale }) {
  const actions = await actionsFor(input.locale);
  if (!actions) return { ok: false as const, code: "unavailable" as const };
  return actions.register(input);
}

export async function logoutAction(locale: Locale) {
  const actions = await actionsFor(locale);
  if (!actions) {
    clearSession(await cookieJar());
    redirect(catalogPath(locale));
  }
  return actions.logout();
}

export async function patchMeAction(input: ProfileInput & { locale: Locale }) {
  const actions = await actionsFor(input.locale);
  if (!actions) return { ok: false as const, code: "unavailable" as const };
  return actions.patchMe(input);
}

export async function deleteAccountAction(locale: Locale) {
  const actions = await actionsFor(locale);
  if (!actions) return { ok: false as const, code: "delete_failed" as const };
  return actions.deleteAccount();
}

export async function loadAccountAction(locale: Locale) {
  const actions = await actionsFor(locale);
  if (!actions) {
    if (!readToken(await cookieJar())) {
      redirect(`${signInPath(locale)}?next=${encodeURIComponent(accountPath(locale))}`);
    }
    return { ok: false as const, code: "unavailable" as const };
  }
  return actions.loadAccount();
}
