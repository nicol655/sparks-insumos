import type { Facets, Product } from "@/lib/api/contract";

/** Note chips and brand chips shown before the shopper types (T092). */
export const SEARCH_SUGGESTION_LIMIT = 3;

export type SearchSuggestion = {
  kind: "note" | "brand";
  value: string;
};

/**
 * Mix of the most common notes and brands so the overlay has something to
 * tap before two characters are typed. Data comes from the repository
 * (facets + the live list), never from fixtures (ADR-0003).
 */
export function buildSearchSuggestions(
  facets: Facets,
  products: Product[],
): SearchSuggestion[] {
  const notes = topNotes(products, SEARCH_SUGGESTION_LIMIT).map((value) => ({
    kind: "note" as const,
    value,
  }));
  const brands = [...facets.brands]
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "es"))
    .slice(0, SEARCH_SUGGESTION_LIMIT)
    .map((facet) => ({ kind: "brand" as const, value: facet.value }));

  return [...notes, ...brands];
}

function topNotes(products: Product[], limit: number): string[] {
  const counts = new Map<string, number>();

  for (const product of products) {
    for (const note of [...product.notes.top, ...product.notes.heart, ...product.notes.base]) {
      counts.set(note, (counts.get(note) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .slice(0, limit)
    .map(([note]) => note);
}
