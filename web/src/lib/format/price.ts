import { INTL_LOCALE, type Locale } from "@/i18n/locales";

/**
 * §06 · "Pesos argentinos con separador de miles de punto y sin decimales:
 * $39.000. Usar Intl.NumberFormat con locale es-AR y no concatenar
 * manualmente."
 *
 * Intl puts a non-breaking space between the symbol and the amount ("$ 39.000")
 * in every locale we support, which the document does not. The parts are
 * therefore reassembled without the separator literals rather than formatted
 * to a string and patched afterwards.
 */
const FORMATTERS = new Map<Locale, Intl.NumberFormat>();

function formatterFor(locale: Locale): Intl.NumberFormat {
  let formatter = FORMATTERS.get(locale);

  if (!formatter) {
    formatter = new Intl.NumberFormat(INTL_LOCALE[locale], {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    FORMATTERS.set(locale, formatter);
  }

  return formatter;
}

/** Formats an amount in Argentine pesos, e.g. 39000 → "$39.000". */
export function formatPrice(amount: number, locale: Locale = "es"): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`Cannot format a non-finite price: ${amount}`);
  }

  return formatterFor(locale)
    .formatToParts(amount)
    .filter((part) => part.type !== "literal")
    .map((part) => part.value)
    .join("");
}
