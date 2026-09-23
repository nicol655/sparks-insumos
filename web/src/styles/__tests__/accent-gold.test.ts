import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * RNF-2 / T106 · accent-gold is 4.4:1 on canvas. That is below AA for body
 * text, so it may only colour type that is ≥24px (or a fill / border, which
 * is not `text-accent-gold`).
 */

const SRC = join(import.meta.dirname, "../..");

const LARGE_TYPE =
  /text-(?:h1-hero|h1-page|h2|h3|price)(?![a-z-])|text-\[(?:2[4-9]|[3-9]\d)px\]/;
const GOLD_TEXT = /(?<![a-z-])(?:hover:|group-hover:)?text-accent-gold(?![a-z-])/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === "__tests__" || name === "node_modules") return [];
      return walk(path);
    }
    return /\.(tsx|ts)$/.test(name) ? [path] : [];
  });
}

describe("accent-gold on text", () => {
  it("never colours type smaller than 24px", () => {
    const offenders: string[] = [];

    for (const file of [...walk(join(SRC, "components")), ...walk(join(SRC, "app"))]) {
      const source = readFileSync(file, "utf8");
      if (!GOLD_TEXT.test(source)) continue;

      const relative = file.slice(SRC.length + 1).replaceAll("\\", "/");

      for (const [index, line] of source.split("\n").entries()) {
        if (!GOLD_TEXT.test(line) || LARGE_TYPE.test(line)) continue;
        offenders.push(`${relative}:${index + 1}: ${line.trim()}`);
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
