import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { INTL_LOCALE } from "@/i18n/locales";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    // Dates and numbers follow the regional variant (es-AR), not the bare
    // language code, so thousands separators match §06.
    formats: { dateTime: {}, number: {}, list: {} },
    now: new Date(),
    timeZone: "America/Argentina/Buenos_Aires",
    getMessageFallback: ({ key, namespace }) => {
      const path = [namespace, key].filter(Boolean).join(".");

      // A missing translation is a bug, not something to paper over silently.
      if (process.env.NODE_ENV !== "production") {
        throw new Error(`Missing ${INTL_LOCALE[locale]} translation: ${path}`);
      }

      return path;
    },
  };
});
