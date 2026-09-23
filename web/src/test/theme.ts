import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Resolved from the Vitest root rather than import.meta.url: Vite rewrites the
// latter to a module-graph URL that is not a file: URL.
const THEME_PATH = resolve(process.cwd(), "src/styles/theme.css");

/**
 * Reads the custom properties declared inside the `@theme` block of
 * `src/styles/theme.css`.
 *
 * That block is the single source of truth for the design tokens: Tailwind
 * turns it into utilities and the browser exposes it as CSS variables. Tests
 * compare it against the tables in the design specification so a hand-edited
 * value cannot drift unnoticed.
 */
export function readThemeTokens(): Map<string, string> {
  const block = extractThemeBlock(readFileSync(THEME_PATH, "utf8"));
  const tokens = new Map<string, string>();

  for (const declaration of stripComments(block).split(";")) {
    const separator = declaration.indexOf(":");
    if (separator === -1) continue;

    const name = declaration.slice(0, separator).trim();
    if (!name.startsWith("--")) continue;

    tokens.set(name, normalizeWhitespace(declaration.slice(separator + 1)));
  }

  return tokens;
}

/** Token names starting with the given prefix, sorted for stable assertions. */
export function tokenNamesWithPrefix(tokens: Map<string, string>, prefix: string): string[] {
  return [...tokens.keys()].filter((name) => name.startsWith(prefix)).sort();
}

function extractThemeBlock(css: string): string {
  const declaration = css.indexOf("@theme");
  if (declaration === -1) throw new Error("theme.css declares no @theme block");

  const open = css.indexOf("{", declaration);
  if (open === -1) throw new Error("@theme block is missing its opening brace");

  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    else if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, index);
    }
  }

  throw new Error("@theme block is never closed");
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
