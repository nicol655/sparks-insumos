export const STORE_FAMILIES = [
  ["ambar-especias", "Ámbar & especias"],
  ["florales", "Florales"],
  ["gourmand", "Gourmand"],
  ["maderas", "Maderas"],
] as const;

export function familyLabel(value: string | null): string {
  return STORE_FAMILIES.find(([slug]) => slug === value)?.[1] ?? "—";
}
