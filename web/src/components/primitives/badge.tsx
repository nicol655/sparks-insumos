import type { ReactNode } from "react";

/**
 * §03 · card badge and stock label.
 *
 * "siempre acompañado de texto, nunca solo color" — hence no icon-only or
 * colour-only variant exists here.
 */

type BadgeProps = {
  children: ReactNode;
  /** Sold out swaps the ink background for the muted one (§03). */
  tone?: "ink" | "muted";
};

/** Sits top-left over the card image: ink fill, canvas text, no radius. */
export function Badge({ children, tone = "ink" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-block px-[8px] py-[5px] font-mono text-[9px] tracking-[0.14em] uppercase",
        tone === "ink" ? "bg-ink text-canvas" : "bg-text-meta text-canvas",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

type StockProps = {
  children: ReactNode;
  inStock: boolean;
};

/** Mono 10px. Ink (not success green) when in stock: #4CA455 is 2.76:1 on canvas. */
export function StockBadge({ children, inStock }: StockProps) {
  return (
    <span
      className={[
        "font-mono text-[10px] tracking-[0.12em] uppercase",
        inStock ? "text-ink" : "text-text-meta",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
