import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { renderTokensJson } from "../../../scripts/tokens-to-json.mjs";

import { readThemeTokens } from "@/test/theme";

/**
 * §05 requires the tokens to ship as CSS variables *and* as JSON. theme.css is
 * the source of truth; design-tokens.json is derived. This suite is what keeps
 * the derived file honest.
 */
describe("design-tokens.json", () => {
  const committed = readFileSync(resolve(process.cwd(), "src/design-tokens.json"), "utf8");
  const themeCss = readFileSync(resolve(process.cwd(), "src/styles/theme.css"), "utf8");

  it("is up to date with theme.css", () => {
    expect(committed).toBe(renderTokensJson(themeCss));
  });

  it("exports every token the CSS declares", () => {
    const fromJson = Object.keys(JSON.parse(committed) as Record<string, string>).sort();
    const fromCss = [...readThemeTokens().keys()].sort();

    expect(fromJson).toEqual(fromCss);
  });
});
