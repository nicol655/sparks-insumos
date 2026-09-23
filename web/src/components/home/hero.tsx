"use client";

import { useTranslations } from "next-intl";

import { Packshot } from "@/components/catalog/packshot";
import { WhatsappDot } from "@/components/icons";
import { BUTTON_TYPE, TOUCH_TARGET } from "@/components/primitives/button-base";
import { Link } from "@/i18n/navigation";
import { buildWhatsappUrl } from "@/lib/whatsapp";

type Props = {
  /** Live catalogue size, shown as "{count}+" in the first stat. */
  catalogSize: number;
};

const STATS = ["references", "dispatch", "rating"] as const;

/**
 * T050 / 003 · home hero. One `<h1>` (AC-14). The right column is full-bleed
 * against the marquee; photography is still the §05 placeholder.
 */
export function Hero({ catalogSize }: Props) {
  const t = useTranslations();
  const whatsappHref = buildWhatsappUrl({ message: t("whatsapp.general") });

  return (
    <section data-home-hero className="lg:grid lg:grid-cols-2">
      <div className="px-gutter py-section flex flex-col justify-center">
        <p className="text-eyebrow text-text-meta flex items-center gap-3.5 uppercase">
          <span aria-hidden="true" className="bg-accent-gold h-px w-8 shrink-0" />
          <span className="min-w-0">{t("home.hero.eyebrow")}</span>
        </p>
        <h1 className="text-h1-hero font-display mt-6">
          {t("home.hero.titleLead")}{" "}
          <em className="text-h1-hero font-normal text-accent-gold italic">
            {t("home.hero.titleEm")}
          </em>
        </h1>
        <p className="text-body-l text-text-muted mt-6 max-w-[46ch]">{t("home.hero.body")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/catalogo"
            className={[
              BUTTON_TYPE,
              TOUCH_TARGET,
              "inline-flex items-center justify-center bg-ink px-[30px] py-[17px] tracking-[0.2em] text-canvas",
              "hover:bg-accent-gold focus-visible:outline-ink",
            ].join(" ")}
          >
            {t("home.hero.ctaCatalog")}
          </Link>
          <a
            href={whatsappHref}
            className={[
              BUTTON_TYPE,
              TOUCH_TARGET,
              "inline-flex items-center justify-center gap-2.5 border border-border-strong px-[26px] py-[16px] tracking-[0.2em] text-ink",
              "hover:border-ink hover:bg-ink/4 focus-visible:outline-ink",
            ].join(" ")}
          >
            <WhatsappDot />
            {t("home.hero.ctaWhatsapp")}
          </a>
        </div>
        <dl className="mt-10 grid grid-cols-3 gap-4 sm:gap-8">
          {STATS.map((key) => (
            <div key={key} className="flex flex-col-reverse">
              <dt className="text-eyebrow text-text-meta mt-2 uppercase">{t(`home.stats.${key}`)}</dt>
              <dd className="text-h3 font-display">
                {key === "references"
                  ? t("home.stats.referencesValue", { count: catalogSize })
                  : t(`home.stats.${key}Value`)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <figure className="relative min-h-[min(70vw,28rem)] lg:h-full lg:min-h-full">
        <Packshot alt={t("home.hero.imageCaption")} src={null} fill priority />
        <figcaption className="text-mono-meta text-text-meta pointer-events-none absolute right-8 bottom-8 font-mono tracking-[0.12em] uppercase">
          {t("home.hero.imageCaption")}
        </figcaption>
      </figure>
    </section>
  );
}
