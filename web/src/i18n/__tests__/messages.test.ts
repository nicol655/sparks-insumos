import { describe, expect, it } from "vitest";

import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import { OLFACTIVE_FAMILIES } from "@/fixtures/catalog";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import { routing } from "@/i18n/routing";

type Dictionary = Record<string, unknown>;

/** "nav.catalog", "home.hero.title", … */
function flatten(value: Dictionary, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    return isDictionary(child) ? flatten(child, path) : [path];
  });
}

function entries(value: Dictionary, prefix = ""): Array<[string, string]> {
  return Object.entries(value).flatMap(([key, child]): Array<[string, string]> => {
    const path = prefix ? `${prefix}.${key}` : key;

    return isDictionary(child) ? entries(child, path) : [[path, String(child)]];
  });
}

function isDictionary(value: unknown): value is Dictionary {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * ICU placeholders: {brand}, {count, plural, …} → "brand", "count".
 *
 * The name must be followed by a comma or a closing brace, otherwise the
 * literal text inside a plural branch ("{Cart is empty}") would count as one.
 */
function placeholders(message: string): Set<string> {
  return new Set([...message.matchAll(/\{\s*(\w+)\s*[,}]/g)].map((match) => match[1] ?? ""));
}

const DICTIONARIES: Record<string, Dictionary> = { es, en };

/**
 * Keys whose value is legitimately identical in both languages: proper nouns,
 * language codes, and strings made only of placeholders. Anything else that
 * matches is untranslated copy — add it here only after deciding it is not.
 */
const SHARED_ACROSS_LANGUAGES = [
  "account.missing",
  "auth.email",
  "auth.emailPh",
  "auth.firstNamePh",
  "auth.lastNamePh",
  "auth.passwordPh",
  "auth.phonePh",
  "brand.name",
  "brand.tagline",
  "cart.price",
  "cart.subtotal",
  "cart.total",
  "catalog.count",
  "catalog.priceMid",
  "catalog.sizeLabel",
  "contact.email",
  "contact.emailPh",
  "contact.emailValue",
  "contact.namePh",
  "contact.phonePh",
  "contact.showroom",
  "contact.showroomValue",
  "contact.waPanelKicker",
  "contact.waShort",
  "contact.whatsappValue",
  "families.gourmand",
  "footer.copyright",
  "footer.facebook",
  "footer.instagram",
  "footer.tiktok",
  "home.club.kicker",
  "home.hero.imageCaption",
  "home.stats.dispatchValue",
  "home.stats.ratingValue",
  "home.stats.referencesValue",
  "locales.enShort",
  "locales.esShort",
  "metadata.title",
  "metadata.titleTemplate",
  "nav.sets",
  "product.metaTitle",
  "whatsapp.brand",
  "whatsapp.orderLine",
  "whatsapp.orderTotal",
];

/** RF-7, AC-8 — a key that exists in one language must exist in the other. */
describe("message dictionaries", () => {
  it("covers every configured locale", () => {
    expect(Object.keys(DICTIONARIES).sort()).toEqual([...LOCALES].sort());
    expect(DICTIONARIES[DEFAULT_LOCALE]).toBeDefined();
  });

  it("declares exactly the same keys in both languages", () => {
    expect(flatten(en).sort()).toEqual(flatten(es).sort());
  });

  it("uses the same ICU placeholders in both languages", () => {
    const english = new Map(entries(en));

    for (const [key, spanish] of entries(es)) {
      expect([key, [...placeholders(english.get(key) ?? "")].sort()]).toEqual([
        key,
        [...placeholders(spanish)].sort(),
      ]);
    }
  });

  it.each(Object.entries(DICTIONARIES))("has no empty string in %s", (_locale, dictionary) => {
    for (const [key, message] of entries(dictionary)) {
      expect(key && message.trim().length > 0).toBe(true);
    }
  });

  it.each(Object.entries(DICTIONARIES))(
    "translates every olfactive family in %s",
    (_locale, dictionary) => {
      const keys = new Set(flatten(dictionary));

      for (const family of OLFACTIVE_FAMILIES) {
        expect(keys.has(`families.${family}`)).toBe(true);
      }
    },
  );

  it.each(Object.entries(DICTIONARIES))(
    "leaves no untranslated copy in %s beyond proper nouns",
    (locale, dictionary) => {
      if (locale === "es") return;

      const spanish = new Map(entries(es));
      const identical = entries(dictionary)
        .filter(([key, message]) => spanish.get(key) === message)
        .map(([key]) => key);

      expect(identical.sort()).toEqual(SHARED_ACROSS_LANGUAGES);
    },
  );
});

describe("routing", () => {
  it("prefixes every URL so each language has a canonical address", () => {
    expect(routing.localePrefix).toBe("always");
    expect(routing.defaultLocale).toBe("es");
  });

  it("translates the route names", () => {
    expect(routing.pathnames["/catalogo"]).toEqual({ es: "/catalogo", en: "/catalogue" });
    expect(routing.pathnames["/carrito"]).toEqual({ es: "/carrito", en: "/cart" });
    expect(routing.pathnames["/contacto"]).toEqual({ es: "/contacto", en: "/contact" });
    expect(routing.pathnames["/registro"]).toEqual({ es: "/registro", en: "/register" });
    expect(routing.pathnames["/cuenta"]).toEqual({ es: "/cuenta", en: "/account" });
  });
});
