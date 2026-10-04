import localFont from "next/font/local";

/**
 * Same latin faces as the storefront, copied so this image can build with
 * the network off (ADR-0006). Do not download them here.
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
