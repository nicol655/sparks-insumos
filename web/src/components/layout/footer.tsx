"use client";

import { useLocale, useTranslations } from "next-intl";

import { Wordmark } from "@/components/layout/wordmark";
import { GOLD_KICKER } from "@/components/primitives/gold-kicker";
import { Link } from "@/i18n/navigation";
import { catalogQuerySchema } from "@/lib/api/contract";
import { catalogUrl } from "@/lib/catalog/search-params";
import type { Locale } from "@/i18n/locales";

/**
 * 002 · footer from the prototype: wordmark + socials, three gold columns,
 * copyright bar. WhatsApp lives on the FAB, not here.
 */

const FOOTER_LINK =
  "inline-flex min-h-11 items-center text-[13.5px] font-light text-canvas/78 " +
  "transition-colors hover:text-canvas " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas";

const SOCIALS = [
  { key: "instagram" as const, href: "https://instagram.com/sparks.insumos" },
  { key: "tiktok" as const, href: "https://www.tiktok.com/@sparks.insumos" },
  { key: "facebook" as const, href: "https://www.facebook.com/sparks.insumos" },
];

export function Footer() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const year = new Date().getFullYear();
  const amberHref = catalogUrl(catalogQuerySchema.parse({ families: ["ambar-especias"] }), locale);
  const gourmandHref = catalogUrl(catalogQuerySchema.parse({ families: ["gourmand"] }), locale);

  return (
    <footer className="bg-ink text-canvas mt-auto px-gutter pt-[clamp(44px,5vw,66px)] pb-[30px]">
      <div className="border-canvas/16 grid grid-cols-1 gap-x-12 gap-y-10 border-b pb-11 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Wordmark onInk align="start" subline={false} size="footer" />
          <p className="max-w-[32ch] text-[13px] font-light leading-[1.7] text-canvas/70">
            {t("footer.blurb")}
          </p>
          <div className="flex flex-wrap gap-3.5">
            {SOCIALS.map((social) => (
              <a
                key={social.key}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-mono-meta inline-flex min-h-11 min-w-11 items-center tracking-[0.14em] uppercase text-canvas underline decoration-canvas/30 underline-offset-4 hover:decoration-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas"
              >
                {t(`footer.${social.key}`)}
              </a>
            ))}
          </div>
        </div>

        <nav aria-label={t("footer.shop")} className="flex flex-col gap-1">
          <p className={GOLD_KICKER}>{t("footer.shop")}</p>
          <Link href="/catalogo" className={FOOTER_LINK}>
            {t("nav.catalog")}
          </Link>
          <a href={amberHref} className={FOOTER_LINK}>
            {t("families.ambar-especias")}
          </a>
          <a href={gourmandHref} className={FOOTER_LINK}>
            {t("families.gourmand")}
          </a>
          <Link href="/sets" className={FOOTER_LINK}>
            {t("nav.sets")}
          </Link>
        </nav>

        <nav aria-label={t("footer.account")} className="flex flex-col gap-1">
          <p className={GOLD_KICKER}>{t("footer.account")}</p>
          <Link href="/ingresar" className={FOOTER_LINK}>
            {t("header.signIn")}
          </Link>
          <Link href="/registro" className={FOOTER_LINK}>
            {t("footer.createAccount")}
          </Link>
          <Link href="/carrito" className={FOOTER_LINK}>
            {t("footer.cart")}
          </Link>
          <Link href="/cuenta" className={FOOTER_LINK}>
            {t("footer.orders")}
          </Link>
        </nav>

        <nav aria-label={t("footer.help")} className="flex flex-col gap-1">
          <p className={GOLD_KICKER}>{t("footer.help")}</p>
          <Link href="/contacto" className={FOOTER_LINK}>
            {t("nav.contact")}
          </Link>
          <Link href="/contacto" className={FOOTER_LINK}>
            {t("footer.shipping")}
          </Link>
          <Link href="/contacto" className={FOOTER_LINK}>
            {t("footer.returns")}
          </Link>
        </nav>
      </div>

      <div className="text-mono-meta mt-[22px] flex flex-wrap justify-between gap-5 font-mono tracking-[0.12em] uppercase text-canvas/55">
        <p>{t("footer.copyright", { year })}</p>
        <p>{t("footer.legal")}</p>
      </div>
    </footer>
  );
}
