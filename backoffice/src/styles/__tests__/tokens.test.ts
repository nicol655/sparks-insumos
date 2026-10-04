import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("theme tokens", () => {
  const css = readFileSync(path.resolve(process.cwd(), "src/styles/theme.css"), "utf8").toLowerCase();

  it("uses the Sparks primaries and clears Tailwind's palette", () => {
    expect(css).toContain("--color-*: initial");
    expect(css).toContain("#14100e");
    expect(css).toContain("#f5f1ea");
    expect(css).toContain("#8a6b32");
  });

  it("does not introduce the example screen's blues", () => {
    for (const hex of ["#1b3a4b", "#4a6fa5", "#5b7c99", "#0f2744", "#1a365d", "#2c5282"]) {
      expect(css).not.toContain(hex);
    }
  });
});
