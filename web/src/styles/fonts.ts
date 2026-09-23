import localFont from "next/font/local";

/**
 * §02 · three families, one job each.
 *
 * The .woff2 files in ./fonts are versioned in the repository and produced by
 * `docker compose run --rm fonts` (see scripts/fetch_fonts.py). They are not
 * downloaded at build time: `next/font/google` hits the network on every build
 * and made the quality gate fail intermittently. See ADR-0006.
 *
 * Subset to latin only — §02 also lists latin-ext, but it measured +84KB over
 * a 180KB budget and neither es-AR nor en uses a codepoint from it. The
 * deviation and the numbers are recorded in ADR-0006.
 *
 * The CSS variables are deliberately named after the typeface, not after the
 * role: the role-level tokens (--font-display, --font-sans, --font-mono) live
 * in theme.css and point here, so swapping a typeface touches one file.
 */

/**
 * Titulares, nombres de producto, cifras y montos.
 *
 * §02 lists 300/400/500/600, but the type scale only ever calls for 400; 500
 * is the wordmark and italic 400 the empty-cart message. 300 and 600 are not
 * used anywhere in the specification, and each unused face is weight nobody
 * downloads for a reason. See RNF-7.
 */
export const cormorant = localFont({
  variable: "--font-cormorant",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  src: [
    { path: "./fonts/cormorant-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cormorant-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/cormorant-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cormorant-500-italic.woff2", weight: "500", style: "italic" },
  ],
});

/** Cuerpo de texto, navegación, botones, formularios y chrome de interfaz. */
export const jost = localFont({
  variable: "--font-jost",
  display: "swap",
  adjustFontFallback: "Arial",
  src: [
    { path: "./fonts/jost-200.woff2", weight: "200", style: "normal" },
    { path: "./fonts/jost-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/jost-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jost-500.woff2", weight: "500", style: "normal" },
  ],
});

/**
 * Etiquetas en mayúsculas, SKU, contadores, kickers y metadatos.
 *
 * No metric-adjusted fallback: the options are Arial and Times New Roman, and
 * neither is monospaced, so an adjusted face would shift the layout more than
 * the browser's own `monospace` does.
 */
export const plexMono = localFont({
  variable: "--font-plex-mono",
  display: "swap",
  adjustFontFallback: false,
  src: [
    { path: "./fonts/plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
});

export const fontVariables = [cormorant.variable, jost.variable, plexMono.variable].join(" ");
