import type { Pathname } from "@/i18n/routing";

/**
 * Primary navigation of the prototype. Sets, contact and sign-in have no page
 * yet (product Phase 2) but they belong in the chrome now so the header
 * matches the design; the catch-all route 404s until those pages exist.
 */
export const NAV_KEY = {
  home: "nav.home",
  catalog: "nav.catalog",
  sets: "nav.sets",
  contact: "nav.contact",
} as const;

export const PRIMARY_NAV = [
  { href: "/", key: "home" },
  { href: "/catalogo", key: "catalog" },
  { href: "/sets", key: "sets" },
  { href: "/contacto", key: "contact" },
] as const satisfies ReadonlyArray<{ href: Pathname; key: keyof typeof NAV_KEY }>;
