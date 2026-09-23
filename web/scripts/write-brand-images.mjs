/**
 * Writes the committed PNG marks (favicon 32, apple 180, icon 512, OG 1200×630).
 * Solid fills only — no licensed artwork. Colours are the §01 ink / canvas / gold.
 *
 *   node scripts/write-brand-images.mjs
 */

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const INK = [0x14, 0x10, 0x0e];
const CANVAS = [0xf5, 0xf1, 0xea];
const GOLD = [0x8a, 0x6b, 0x32];

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

writeFileSync(join(out, "favicon-32.png"), mark(32, 32));
writeFileSync(join(out, "apple-touch-icon.png"), mark(180, 180));
writeFileSync(join(out, "icon-512.png"), mark(512, 512));
writeFileSync(join(out, "og.png"), og(1200, 630));

function mark(width, height) {
  const inset = Math.round(width * 0.25);
  return png(width, height, (x, y) => {
    const inner = x >= inset && x < width - inset && y >= inset && y < height - inset;
    return inner ? GOLD : INK;
  });
}

function og(width, height) {
  const bar = Math.round(width * 0.08);
  return png(width, height, (x) => (x < bar ? INK : CANVAS));
}

function png(width, height, pixel) {
  const raw = Buffer.alloc((width * 3 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pixel(x, y);
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}
