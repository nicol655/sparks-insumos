"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { SIGNED_IN_COOKIE } from "@/lib/auth/session";

type Params = Record<string, string | string[] | undefined>;

/**
 * Header, menu and footer account entry (spec 008 AC-13).
 *
 * The first paint is always «Ingresar», so the static HTML does not depend
 * on the presence cookie. After mount, `sparks_signed_in=1` switches it to
 * the account page. The token itself is never read here.
 */
export function AccountLink({ className, onClick }: { className?: string; onClick?: () => void }) {
  const header = useTranslations("header");
  const account = useTranslations("account");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const params = useParams();
  const signedIn = useSyncExternalStore(subscribe, readPresence, signedOut);

  const label = signedIn ? account("menu") : header("signIn");

  if (signedIn) {
    return (
      <Link href="/cuenta" className={className} onClick={onClick}>
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={{ pathname: "/ingresar", query: { next: returnPath(pathname, locale, params) } }}
      className={className}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

function subscribe() {
  return () => undefined;
}

function signedOut() {
  return false;
}

function readPresence(): boolean {
  return document.cookie.split(";").some((part) => {
    const [name, value] = part.trim().split("=");
    return name === SIGNED_IN_COOKIE && value === "1";
  });
}

function returnPath(pathname: string, locale: Locale, params: Params): string {
  const key = pathname as keyof typeof routing.pathnames;
  const entry = routing.pathnames[key];
  let path = entry ? (typeof entry === "string" ? entry : entry[locale]) : pathname;

  for (const [name, value] of Object.entries(params)) {
    if (name === "locale" || typeof value !== "string") continue;
    path = path.replace(`[${name}]`, value);
  }

  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
