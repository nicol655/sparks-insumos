import type { Metadata } from "next";

import type { Locale } from "@/i18n/locales";
import { routing, type Pathname } from "@/i18n/routing";

/**
 * T107 · per-route metadata shared by every locale layout/page.
 *
 * `alternates.languages` is the hreflang pair (`es-AR` ↔ `en`). Canonical is
 * the current locale so sharing a filtered URL does not advertise the other
 * language as the preferred one.
 */

export function localizedHref(
  pathname: Pathname,
  locale: Locale,
  params?: Record<string, string>,
): string {
  const names = routing.pathnames[pathname];
  let path: string = typeof names === "string" ? names : names[locale];

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`[${key}]`, value);
    }
  }

  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export function seoMetadata({
  locale,
  pathname,
  params,
  title,
  description,
}: {
  locale: Locale;
  pathname: Pathname;
  params?: Record<string, string>;
  title?: string;
  description?: string;
}): Metadata {
  const canonical = localizedHref(pathname, locale, params);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "es-AR": localizedHref(pathname, "es", params),
        en: localizedHref(pathname, "en", params),
        "x-default": localizedHref(pathname, "es", params),
      },
    },
    openGraph: {
      title,
      description,
      locale: locale === "es" ? "es_AR" : "en_US",
      url: canonical,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
    },
  };
}
