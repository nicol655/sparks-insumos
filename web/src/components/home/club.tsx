"use client";

import { useTranslations } from "next-intl";

import { BUTTON_TYPE, TOUCH_TARGET } from "@/components/primitives/button-base";
import { GOLD_INDEX, GOLD_KICKER } from "@/components/primitives/gold-kicker";
import { Link } from "@/i18n/navigation";

const BENEFITS = ["member", "early", "vip", "track"] as const;

/**
 * 002 · Sparks Club band. Account CTAs go to reserved Fase 2 routes;
 * the 5% / VIP15 / 48 h lines are copy, not cart rules.
 */
export function Club() {
  const t = useTranslations("home.club");

  return (
    <section className="border-canvas/12 bg-ink text-canvas border-b">
      <div className="lg:grid lg:grid-cols-2">
        <div className="px-gutter py-section flex min-w-0 flex-col justify-center gap-6">
          <p className={GOLD_KICKER}>{t("kicker")}</p>
          <h2 className="font-display min-w-0 text-[clamp(2.125rem,4.4vw,3.5rem)] leading-[1.02]">
            {t("title")}
          </h2>
          <p className="text-body-l max-w-[44ch] text-canvas/80">{t("body")}</p>
          <div className="flex flex-wrap gap-3.5">
            <Link
              href="/registro"
              className={[
                BUTTON_TYPE,
                TOUCH_TARGET,
                "inline-flex items-center justify-center bg-canvas px-7 py-4 tracking-[0.2em] text-ink",
                "hover:bg-accent-gold focus-visible:outline-canvas",
              ].join(" ")}
            >
              {t("ctaCreate")}
            </Link>
            <Link
              href="/ingresar"
              className={[
                BUTTON_TYPE,
                TOUCH_TARGET,
                "inline-flex items-center justify-center border border-canvas/35 px-[26px] py-[15px] tracking-[0.2em] text-canvas",
                "hover:border-canvas focus-visible:outline-canvas",
              ].join(" ")}
            >
              {t("ctaSignIn")}
            </Link>
          </div>
        </div>

        <ol className="border-canvas/18 lg:border-l">
          {BENEFITS.map((key, index) => (
            <li
              key={key}
              className="border-canvas/14 flex items-center gap-[22px] border-b px-6 py-[26px] last:border-b-0 lg:px-11"
            >
              <span className={GOLD_INDEX}>{String(index + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1">
                <p className="text-h5 font-display">{t(`${key}Title`)}</p>
                <p className="text-body-s text-canvas/70">{t(`${key}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
