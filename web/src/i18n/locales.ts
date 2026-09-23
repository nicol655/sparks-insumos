/**
 * §06 · "Dos locales, es-AR (por defecto) y en."
 *
 * Kept in its own module with no dependencies so the data layer can be
 * locale-aware without pulling in the routing setup.
 */
export const LOCALES = ["es", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

/** BCP 47 tag per locale, used for Intl formatting. */
export const INTL_LOCALE: Record<Locale, string> = {
  es: "es-AR",
  en: "en-US",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
