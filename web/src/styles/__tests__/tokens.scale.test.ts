import { beforeAll, describe, expect, it } from "vitest";

import { readThemeTokens, tokenNamesWithPrefix } from "@/test/theme";

/**
 * AC-2 and AC-3 — §02 and §04 of the design specification.
 *
 * The type scale is fluid: every level is a clamp() whose minimum is the size
 * at a 360px viewport and whose maximum is the size from 1440px up. "No
 * interpolar manualmente: usar los clamp tal como están."
 *
 * The preferred term of each clamp is the straight line between those two
 * points:
 *
 *   slope(vw)     = (max - min) / (1440 - 360) * 100
 *   intercept(px) = min - (max - min) / 3
 */

type Level = { size: string; lineHeight: string; letterSpacing: string };

const TYPE_SCALE: Record<string, Level> = {
  // Titular de portada · Cormorant 400 · 40 → 104px
  "h1-hero": {
    size: "clamp(2.5rem, 1.1667rem + 5.9259vw, 6.5rem)",
    lineHeight: "0.92",
    letterSpacing: "-0.02em",
  },
  // Título de catálogo, carrito, checkout, cuenta · 32 → 52px
  "h1-page": {
    size: "clamp(2rem, 1.5833rem + 1.8519vw, 3.25rem)",
    lineHeight: "1.02",
    letterSpacing: "0",
  },
  // Encabezado de sección · 30 → 46px
  h2: {
    size: "clamp(1.875rem, 1.5417rem + 1.4815vw, 2.875rem)",
    lineHeight: "1.05",
    letterSpacing: "-0.01em",
  },
  // Tarjeta de familia, panel de club · 24 → 32px
  h3: {
    size: "clamp(1.5rem, 1.3333rem + 0.7407vw, 2rem)",
    lineHeight: "1.05",
    letterSpacing: "0",
  },
  // Nombre de producto en tarjeta, notas de pirámide · 19 → 21px
  h4: {
    size: "clamp(1.1875rem, 1.1458rem + 0.1852vw, 1.3125rem)",
    lineHeight: "1.15",
    letterSpacing: "0",
  },
  // Título de beneficio, línea de carrito, contacto · 18 → 24px
  h5: {
    size: "clamp(1.125rem, 1rem + 0.5556vw, 1.5rem)",
    lineHeight: "1.2",
    letterSpacing: "0",
  },
  // H6 · encabezado de grupo de filtros, leyenda de formulario · Jost · 11 → 12px
  eyebrow: {
    size: "clamp(0.6875rem, 0.6667rem + 0.0926vw, 0.75rem)",
    lineHeight: "1.3",
    letterSpacing: "0.16em",
  },
  // Bajada de hero y de sección · Jost 300 · 15 → 16px
  "body-l": {
    size: "clamp(0.9375rem, 0.9167rem + 0.0926vw, 1rem)",
    lineHeight: "1.65",
    letterSpacing: "0",
  },
  // Descripciones, texto de ficha, ayudas · 13.5 → 14.5px
  "body-m": {
    size: "clamp(0.8438rem, 0.8229rem + 0.0926vw, 0.9063rem)",
    lineHeight: "1.7",
    letterSpacing: "0",
  },
  // Notas al pie, avisos de envío y mínimos · 11.5 → 12.5px
  "body-s": {
    size: "clamp(0.7188rem, 0.6979rem + 0.0926vw, 0.7813rem)",
    lineHeight: "1.6",
    letterSpacing: "0",
  },
  // Navegación, botones, chips, pestañas · 10 → 12px · tracking 0.14–0.20em
  label: {
    size: "clamp(0.625rem, 0.5833rem + 0.1852vw, 0.75rem)",
    lineHeight: "1",
    letterSpacing: "0.14em",
  },
  // Kickers, SKU, contadores, encabezados de tabla · 9 → 11px · tracking 0.12–0.22em
  "mono-meta": {
    size: "clamp(0.5625rem, 0.5208rem + 0.1852vw, 0.6875rem)",
    lineHeight: "1.5",
    letterSpacing: "0.12em",
  },
  // Precio en ficha de producto · 28 → 40px
  price: {
    size: "clamp(1.75rem, 1.5rem + 1.1111vw, 2.5rem)",
    lineHeight: "1",
    letterSpacing: "0",
  },
  // Valor tipeado en formularios · 14.5px. Not fluid: the mobile size is a
  // hard 16px to stop iOS auto-zoom, which is a threshold, not a ramp.
  input: {
    size: "0.9063rem",
    lineHeight: "1.3",
    letterSpacing: "0",
  },
  "input-mobile": {
    size: "1rem",
    lineHeight: "1.3",
    letterSpacing: "0",
  },
};

/** §02 · three families, each with the fallback stack from the document. */
const FONT_FAMILIES = {
  "--font-display": 'var(--font-cormorant), Georgia, "Times New Roman", serif',
  "--font-sans": 'var(--font-jost), "Helvetica Neue", Helvetica, sans-serif',
  "--font-mono": 'var(--font-plex-mono), "SF Mono", Menlo, monospace',
} as const;

/** §04 · the six thresholds of the document, as min-width breakpoints. */
const BREAKPOINTS = {
  "--breakpoint-sm": "560px",
  "--breakpoint-md": "700px",
  "--breakpoint-lg": "900px",
  "--breakpoint-xl": "1140px",
  "--breakpoint-2xl": "1440px",
  "--breakpoint-3xl": "2160px",
} as const;

/** §04 · named spacing that falls outside the 4px base scale. */
const LAYOUT = {
  // "Gutter horizontal clamp(20px, 4.4vw, 64px)"
  "--spacing-gutter": "clamp(1.25rem, 4.4vw, 4rem)",
  // space-8 · padding vertical de sección · 48 → 84px
  "--spacing-section": "clamp(3rem, 2.25rem + 3.3333vw, 5.25rem)",
  // Grilla de tarjetas de producto: 30px vertical / 26px horizontal
  "--spacing-grid-x": "1.625rem",
  "--spacing-grid-y": "1.875rem",
  // "El contenedor raíz se limita a 2160px y se centra."
  "--container-root": "135rem",
} as const;

describe("type scale", () => {
  let tokens: Map<string, string>;

  beforeAll(() => {
    tokens = readThemeTokens();
  });

  it("clears Tailwind's default type scale", () => {
    expect(tokens.get("--text-*")).toBe("initial");
  });

  it.each(Object.entries(FONT_FAMILIES))("declares %s as %s", (name, value) => {
    expect(tokens.get(name)).toBe(value);
  });

  it("declares exactly the three families of §02", () => {
    expect(tokens.get("--font-*")).toBe("initial");
    expect(tokenNamesWithPrefix(tokens, "--font-")).toEqual(
      ["--font-*", ...Object.keys(FONT_FAMILIES)].sort(),
    );
  });

  it.each(Object.entries(TYPE_SCALE))("sizes %s with its clamp", (level, { size }) => {
    expect(tokens.get(`--text-${level}`)).toBe(size);
  });

  it.each(Object.entries(TYPE_SCALE))("sets the line-height of %s", (level, { lineHeight }) => {
    expect(tokens.get(`--text-${level}--line-height`)).toBe(lineHeight);
  });

  it.each(Object.entries(TYPE_SCALE))(
    "sets the letter-spacing of %s",
    (level, { letterSpacing }) => {
      expect(tokens.get(`--text-${level}--letter-spacing`)).toBe(letterSpacing);
    },
  );

  it("declares no type level beyond §02", () => {
    const expected = [
      "--text-*",
      ...Object.keys(TYPE_SCALE).flatMap((level) => [
        `--text-${level}`,
        `--text-${level}--line-height`,
        `--text-${level}--letter-spacing`,
      ]),
    ].sort();

    expect(tokenNamesWithPrefix(tokens, "--text-")).toEqual(expected);
  });

  it("never drops below the 9px floor of the document", () => {
    // The smallest declared minimum is mono-meta at 9px (0.5625rem).
    const minimums = Object.values(TYPE_SCALE).map(({ size }) => minimumRem(size));

    expect(Math.min(...minimums) * 16).toBeGreaterThanOrEqual(9);
  });
});

describe("layout scale", () => {
  let tokens: Map<string, string>;

  beforeAll(() => {
    tokens = readThemeTokens();
  });

  it("keeps the 4px base spacing scale", () => {
    expect(tokens.get("--spacing")).toBe("0.25rem");
  });

  it.each(Object.entries(BREAKPOINTS))("declares %s at %s", (name, value) => {
    expect(tokens.get(name)).toBe(value);
  });

  it("replaces Tailwind's breakpoints instead of extending them", () => {
    expect(tokens.get("--breakpoint-*")).toBe("initial");
    expect(tokenNamesWithPrefix(tokens, "--breakpoint-")).toEqual(
      ["--breakpoint-*", ...Object.keys(BREAKPOINTS)].sort(),
    );
  });

  it.each(Object.entries(LAYOUT))("declares %s as %s", (name, value) => {
    expect(tokens.get(name)).toBe(value);
  });

  it("defaults transitions to the 180ms micro-interaction of §06", () => {
    expect(tokens.get("--default-transition-duration")).toBe("180ms");
    expect(tokens.get("--default-transition-timing-function")).toBe("ease");
  });

  it("leaves the chip as the only rounded shape in the system", () => {
    expect(tokens.get("--radius-*")).toBe("initial");
    expect(tokens.get("--radius-chip")).toBe("999px");
    expect(tokenNamesWithPrefix(tokens, "--radius-")).toEqual(["--radius-*", "--radius-chip"]);
  });
});

/** Extracts the first argument of a clamp(), or the value itself if not fluid. */
function minimumRem(size: string): number {
  const clamp = /^clamp\(\s*([\d.]+)rem/.exec(size);
  if (clamp?.[1]) return Number(clamp[1]);

  const fixed = /^([\d.]+)rem$/.exec(size);
  if (fixed?.[1]) return Number(fixed[1]);

  throw new Error(`Cannot read a minimum size from "${size}"`);
}
