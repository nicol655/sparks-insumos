import type { Locale } from "@/i18n/locales";
import { routing } from "@/i18n/routing";

/**
 * Where login may send the shopper (spec 008 RF-2).
 *
 * Anything that is not a path on this site — another host, a protocol, the
 * sign-in pages themselves — becomes the catalogue, so `next` cannot be an
 * open redirect.
 */

const ORIGIN = "http://sparks.local";

function localized(
  locale: Locale,
  pathname: "/catalogo" | "/ingresar" | "/registro" | "/cuenta",
): string {
  const entry = routing.pathnames[pathname];
  const path = typeof entry === "string" ? entry : entry[locale];
  return `/${locale}${path}`;
}

export function catalogPath(locale: Locale): string {
  return localized(locale, "/catalogo");
}

export function signInPath(locale: Locale): string {
  return localized(locale, "/ingresar");
}

export function accountPath(locale: Locale): string {
  return localized(locale, "/cuenta");
}

export function safeNext(value: string | null | undefined, locale: Locale): string {
  const fallback = catalogPath(locale);
  if (value === null || value === undefined || value.trim() === "") return fallback;
  if (value.includes("\\") || value.includes("@")) return fallback;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (decoded.includes("\\") || decoded.includes("@") || decoded.includes("://")) return fallback;

  let url: URL;
  try {
    url = new URL(decoded, ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== ORIGIN) return fallback;
  if (!url.pathname.startsWith(`/${locale}/`) && url.pathname !== `/${locale}`) return fallback;
  if (url.pathname.split("/").includes("..")) return fallback;

  const blocked = [localized(locale, "/ingresar"), localized(locale, "/registro")];
  if (blocked.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) {
    return fallback;
  }

  return `${url.pathname}${url.search}`;
}
