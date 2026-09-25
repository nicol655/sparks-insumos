import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const THEME_PATH = resolve(process.cwd(), "src/styles/theme.css");

describe("action cursor", () => {
  const css = readFileSync(THEME_PATH, "utf8");

  it("uses the pointer on links, buttons, labels and enabled roles", () => {
    expect(css).toContain("a[href]");
    expect(css).toContain("button:not(:disabled)");
    expect(css).toContain("label");
    expect(css).toContain("summary");
    expect(css).toContain('[role="button"]:not([aria-disabled="true"])');
    expect(css).toContain('[role="link"]:not([aria-disabled="true"])');
    expect(css).toContain("cursor: pointer");
  });

  it("uses not-allowed on a disabled button or aria-disabled control", () => {
    expect(css).toContain("button:disabled");
    expect(css).toContain('[aria-disabled="true"]');
    expect(css).toContain("cursor: not-allowed");
  });
});
