/**
 * Generates src/design-tokens.json from the @theme block of theme.css.
 *
 * §05 of the design specification requires the palette and the scale to be
 * exported "como variables CSS y como JSON para el consumo del front-end".
 * theme.css is the source; this file is a derived artifact and is committed so
 * consumers can read it without running a build.
 *
 * Run with: npm run tokens:json
 * A test fails if the committed JSON is out of date.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const THEME = resolve(process.cwd(), "src/styles/theme.css");
const OUTPUT = resolve(process.cwd(), "src/design-tokens.json");

export function parseThemeTokens(css) {
  const block = extractThemeBlock(css);
  const tokens = {};

  for (const declaration of block.replace(/\/\*[\s\S]*?\*\//g, "").split(";")) {
    const separator = declaration.indexOf(":");
    if (separator === -1) continue;

    const name = declaration.slice(0, separator).trim();
    if (!name.startsWith("--")) continue;

    tokens[name] = declaration
      .slice(separator + 1)
      .trim()
      .replace(/\s+/g, " ");
  }

  return Object.fromEntries(Object.entries(tokens).sort(([a], [b]) => a.localeCompare(b)));
}

export function renderTokensJson(css) {
  return `${JSON.stringify(parseThemeTokens(css), null, 2)}\n`;
}

function extractThemeBlock(css) {
  const declaration = css.indexOf("@theme");
  if (declaration === -1) throw new Error("theme.css declares no @theme block");

  const open = css.indexOf("{", declaration);
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

// Only write when invoked directly, so the test can import the functions.
if (process.argv[1] && process.argv[1].endsWith("tokens-to-json.mjs")) {
  writeFileSync(OUTPUT, renderTokensJson(readFileSync(THEME, "utf8")), "utf8");
  console.log(`Wrote ${OUTPUT}`);
}
