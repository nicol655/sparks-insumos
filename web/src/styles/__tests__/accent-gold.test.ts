import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * RNF-2 / T106 / ADR-0009 · accent-gold is 4.4:1 on canvas. Body and titles
 * stay ≥24px. The prototype's mono kickers are 10px gold — that size is
 * allowed on purpose so the storefront keeps the thin editorial labels.
 */

const SRC = join(import.meta.dirname, "../..");

const ALLOWED_GOLD_TYPE =
  /text-(?:h1-hero|h1-page|h2|h3|price)(?![a-z-])|text-\[(?:10px|2[4-9]px|[3-9]\dpx)\]/;
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
  it("only colours 10px kickers or type ≥24px", () => {
    const offenders: string[] = [];

    for (const file of [...walk(join(SRC, "components")), ...walk(join(SRC, "app"))]) {
      const source = readFileSync(file, "utf8");
      if (!GOLD_TEXT.test(source)) continue;

      const relative = file.slice(SRC.length + 1).replaceAll("\\", "/");

      for (const [index, line] of source.split("\n").entries()) {
        if (!GOLD_TEXT.test(line) || ALLOWED_GOLD_TYPE.test(line)) continue;
        offenders.push(`${relative}:${index + 1}: ${line.trim()}`);
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
