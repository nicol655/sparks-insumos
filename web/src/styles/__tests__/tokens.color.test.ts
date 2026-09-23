import { beforeAll, describe, expect, it } from "vitest";

import { readThemeTokens, tokenNamesWithPrefix } from "@/test/theme";

/**
 * AC-1 — §01 of the design specification.
 *
 * "La paleta es deliberadamente corta (...) No agregar colores nuevos sin
 * aprobación de diseño." This suite is what makes that rule enforceable.
 */

/** Literal colours, exactly as published in §01. */
const PALETTE = {
  // Primarios
  "--color-ink": "#14100E",
  "--color-canvas": "#F5F1EA",
  "--color-accent-gold": "#8A6B32",
  // Secundarios y superficies
  "--color-surface-raised": "#FBF9F5",
  "--color-ink-raised": "#1E1915",
  "--color-placeholder-a": "#EDE7DC",
  "--color-placeholder-b": "#F2EDE4",
  // Neutros de texto y borde
  "--color-text-muted": "#3E3731",
  "--color-text-meta": "#6F665A",
  "--color-border-hairline": "rgb(20 16 14 / 0.12)",
  "--color-border-strong": "rgb(20 16 14 / 0.28)",
  "--color-border-on-ink": "rgb(245 241 234 / 0.16)",
  // Semánticos con valor propio
  "--color-success": "#4CA455",
  "--color-danger": "#B4443A",
} as const;

/**
 * Semantic names that §01 defines as reusing another token. They must be
 * aliases, never a second copy of the same hex.
 */
const ALIASES = {
  "--color-whatsapp": "--color-success",
  "--color-warning": "--color-accent-gold",
  "--color-info": "--color-text-muted",
} as const;

/**
 * The only colour outside §01 that the document authorises: the pressed state
 * of the primary button, "#6F5527 (accent oscurecido 12%)" in §03.
 */
const COMPONENT_STATE_COLORS = {
  "--color-accent-gold-pressed": "#6F5527",
} as const;

/** Namespace reset that removes Tailwind's built-in palette. */
const PALETTE_RESET = "--color-*";

describe("colour tokens", () => {
  let tokens: Map<string, string>;

  beforeAll(() => {
    tokens = readThemeTokens();
  });

  it("clears Tailwind's default palette", () => {
    expect(tokens.get(PALETTE_RESET)).toBe("initial");
  });

  // Values are compared case-insensitively: the constants above keep the
  // uppercase of the document so this file reads like §01, while Prettier
  // normalises the stylesheet to lowercase. Hex case carries no meaning.
  it.each(Object.entries(PALETTE))("declares %s as %s", (name, value) => {
    expect(tokens.get(name)?.toLowerCase()).toBe(value.toLowerCase());
  });

  it.each(Object.entries(COMPONENT_STATE_COLORS))("declares %s as %s", (name, value) => {
    expect(tokens.get(name)?.toLowerCase()).toBe(value.toLowerCase());
  });

  it.each(Object.entries(ALIASES))("declares %s as an alias of %s", (name, target) => {
    expect(tokens.get(name)).toBe(`var(${target})`);
  });

  it("introduces no colour beyond the approved set", () => {
    const approved = [
      PALETTE_RESET,
      ...Object.keys(PALETTE),
      ...Object.keys(COMPONENT_STATE_COLORS),
      ...Object.keys(ALIASES),
    ].sort();

    expect(tokenNamesWithPrefix(tokens, "--color-")).toEqual(approved);
  });

  it("keeps every alias pointing at a token that exists", () => {
    for (const target of Object.values(ALIASES)) {
      expect(tokens.has(target)).toBe(true);
    }
  });
});
