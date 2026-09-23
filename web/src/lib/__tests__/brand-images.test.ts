import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PUBLIC = join(import.meta.dirname, "../../../public");

function pngSize(name: string): { width: number; height: number } {
  const buffer = readFileSync(join(PUBLIC, name));
  expect(buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe("brand images (T107)", () => {
  it("ships the favicon and Open Graph sizes from the spec", () => {
    expect(pngSize("favicon-32.png")).toEqual({ width: 32, height: 32 });
    expect(pngSize("apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
    expect(pngSize("icon-512.png")).toEqual({ width: 512, height: 512 });
    expect(pngSize("og.png")).toEqual({ width: 1200, height: 630 });
  });
});
