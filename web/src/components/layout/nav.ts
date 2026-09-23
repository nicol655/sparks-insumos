import type { Pathname } from "@/i18n/routing";

/**
 * Primary navigation of the prototype. Contact is live (004). Sets and
 * sign-in still 404 via the catch-all until those Fase 2 pages exist.
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
