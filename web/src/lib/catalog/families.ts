/**
 * Olfactive family slugs travel on the product; the label lives in the
 * dictionary under `families.<slug>` so home tiles and catalogue chips stay
 * in sync (RF-7).
 */
export const FAMILY_MESSAGE = {
  "ambar-especias": "families.ambar-especias",
  florales: "families.florales",
  gourmand: "families.gourmand",
  maderas: "families.maderas",
} as const;

export type FamilySlug = keyof typeof FAMILY_MESSAGE;

export function isFamilySlug(value: string): value is FamilySlug {
  return value in FAMILY_MESSAGE;
}
