import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

/**
 * §05 · "Wordmark «SPARKS» en Cormorant Garamond 500, tracking 0.26em,
 * mayúsculas, con bajada opcional «PARFUMS · BUENOS AIRES» en 8.5px tracking
 * 0.42em."
 *
 * Set as text, not as the delivered SVG: the typeface is already self-hosted,
 * so text scales with the type system, stays selectable and needs no second
 * asset for the inverted variant. §02's "los títulos serif nunca van en
 * mayúsculas" carves out the logo explicitly.
 */

type Props = {
  /** Hides the "PARFUMS · BUENOS AIRES" subline where vertical room is tight. */
  subline?: boolean;
  /** Inverted palette, for the ink footer. */
  onInk?: boolean;
  /** Footer sits the mark on the left; the header centres it. */
  align?: "center" | "start";
  /** Footer mark is 28px (prototype); header stays 19px (§05). */
  size?: "header" | "footer";
};

export function Wordmark({
  subline = true,
  onInk = false,
  align = "center",
  size = "header",
}: Props) {
  const t = useTranslations("brand");

  return (
    <Link
      href="/"
      aria-label={t("home")}
      className={[
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "flex min-h-11 flex-col justify-center leading-none",
        align === "start" ? "items-start" : "items-center",
        onInk ? "text-canvas focus-visible:outline-canvas" : "text-ink focus-visible:outline-ink",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "font-display font-medium tracking-[0.26em] uppercase",
          size === "footer" ? "text-[28px]" : "text-[19px]",
        ].join(" ")}
      >
        {t("name")}
      </span>
      {subline ? (
        <span
          aria-hidden="true"
          className={[
            "mt-[5px] font-mono text-[8.5px] tracking-[0.42em] uppercase",
            onInk ? "text-canvas/78" : "text-text-meta",
          ].join(" ")}
        >
          {t("tagline")}
        </span>
      ) : null}
    </Link>
  );
}
