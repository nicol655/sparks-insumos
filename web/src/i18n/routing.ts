import { defineRouting } from "next-intl/routing";

import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";

/**
 * RF-7 · every page exists at /es and /en.
 *
 * `always` rather than hiding the default prefix: one canonical URL per
 * language keeps hreflang unambiguous for search engines, and "/" simply
 * redirects to the shopper's best match.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  /**
   * Route names are translated so the Spanish site reads /es/catalogo and the
   * English one /en/catalogue, while the code refers to a single pathname.
   */
  pathnames: {
    "/": "/",
    "/catalogo": { es: "/catalogo", en: "/catalogue" },
    "/catalogo/[slug]": { es: "/catalogo/[slug]", en: "/catalogue/[slug]" },
    "/carrito": { es: "/carrito", en: "/cart" },
    // Chrome of the prototype; the pages themselves are Phase 2 of the product.
    "/sets": "/sets",
    "/contacto": { es: "/contacto", en: "/contact" },
    "/ingresar": { es: "/ingresar", en: "/sign-in" },
    "/registro": { es: "/registro", en: "/register" },
    "/cuenta": { es: "/cuenta", en: "/account" },
  },
});

export type Pathname = keyof typeof routing.pathnames;
