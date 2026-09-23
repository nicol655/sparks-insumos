"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { LOCALES, type Locale } from "@/i18n/locales";
import { usePathname, useRouter } from "@/i18n/navigation";
import { queryRecordFromSearchParams } from "@/lib/catalog/search-params";

const SHORT_KEY = {
  es: "locales.esShort",
  en: "locales.enShort",
} as const;

const NAME_KEY = {
  es: "locales.es",
  en: "locales.en",
} as const;

/**
 * US-6 / AC-7 · switches language without a full reload.
 *
 * `router.replace` from next-intl is client-side navigation: the `[locale]`
 * layout remounts, but the cart lives in localStorage so it comes back
 * (ADR-0002). The current path is preserved, including translated pathnames
 * (`/es/catalogo` → `/en/catalogue`). Dynamic segments travel via `useParams`
 * because the typed `pathname` is `/catalogo/[slug]`, not the filled URL.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();

  return (
    <nav aria-label={t("header.languageLabel")} className="flex items-center gap-2">
      {LOCALES.map((code) => {
        const current = code === locale;

        return (
          <button
            key={code}
            type="button"
            aria-current={current ? "true" : undefined}
            aria-label={t("header.languageSwitch", { language: t(NAME_KEY[code]) })}
            onClick={() => {
              if (current) return;
              // Read at click time so the header can still prerender. useSearchParams
              // would force a Suspense boundary on every page that mounts the chrome.
              const query = queryRecordFromSearchParams(
                new URLSearchParams(window.location.search),
              );
              router.replace(
                {
                  pathname,
                  params,
                  ...(Object.keys(query).length > 0 ? { query } : {}),
                } as Parameters<typeof router.replace>[0],
                { locale: code as Locale },
              );
            }}
            className={[
              "inline-flex min-h-11 min-w-11 items-center justify-center",
              "font-sans text-label tracking-[0.14em] uppercase transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              current ? "text-ink" : "text-text-meta hover:text-ink",
            ].join(" ")}
          >
            {t(SHORT_KEY[code])}
          </button>
        );
      })}
    </nav>
  );
}
