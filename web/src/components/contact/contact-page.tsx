"use client";

import { useTranslations } from "next-intl";

import { ContactForm } from "@/components/contact/contact-form";
import { GOLD_KICKER } from "@/components/primitives/gold-kicker";
import { WhatsappDot } from "@/components/icons";
import { buildWhatsappUrl } from "@/lib/whatsapp";

const CHANNELS = [
  { key: "whatsapp", labelKey: "whatsapp.brand" },
  { key: "email", labelKey: "contact.email" },
  { key: "showroom", labelKey: "contact.showroom" },
] as const;

/**
 * 004 · contact page from the prototype. Two columns from 900px; the form
 * does not send; the ink panel is a real wa.me link.
 */
export function ContactPage() {
  const t = useTranslations();
  const whatsappHref = buildWhatsappUrl({ message: t("whatsapp.general") });

  return (
    <main className="border-border-hairline grid border-b lg:grid-cols-2">
      <div className="flex flex-col gap-6 px-gutter pt-[clamp(42px,5vw,66px)] pb-[clamp(52px,6vw,80px)]">
        <p className={GOLD_KICKER}>{t("contact.kicker")}</p>
        <h1 className="font-display text-[clamp(2.125rem,4.4vw,3.5rem)] leading-[1.02]">
          {t("contact.title")}
        </h1>
        <p className="text-text-muted max-w-[48ch] text-[14.5px] font-light leading-[1.75]">
          {t("contact.body")}
        </p>
        <ContactForm />
      </div>

      <aside className="border-border-hairline flex flex-col lg:border-l">
        {CHANNELS.map((channel) => (
          <div
            key={channel.key}
            className="border-border-hairline flex flex-col gap-1.5 border-b px-[clamp(20px,3.6vw,48px)] py-[clamp(22px,3vw,30px)]"
          >
            <p className="text-text-meta font-mono text-[9.5px] tracking-[0.16em] uppercase">
              {t(channel.labelKey)}
            </p>
            <p className="font-display text-[24px] leading-none">
              {t(`contact.${channel.key}Value`)}
            </p>
            <p className="text-text-muted text-[12.5px] font-light">
              {t(`contact.${channel.key}Note`)}
            </p>
          </div>
        ))}

        <a
          href={whatsappHref}
          className={[
            "bg-ink text-canvas flex flex-1 flex-col justify-center gap-3",
            "px-[clamp(20px,3.6vw,48px)] py-[clamp(30px,4vw,40px)]",
            "hover:bg-ink-raised",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          ].join(" ")}
        >
          <span className="flex min-h-11 min-w-0 flex-wrap items-center gap-2.5 font-mono text-[24px] leading-[1.15] tracking-[0.12em] uppercase">
            <WhatsappDot />
            <span className="min-w-0">
              {t("contact.waPanelKicker", { short: t("contact.waShort") })}
            </span>
          </span>
          <span className="font-display text-[32px] leading-[1.1]">{t("contact.waPanelTitle")}</span>
          <span className="max-w-[34ch] text-[13px] font-light text-canvas/75">
            {t("contact.waPanelBody")}
          </span>
        </a>
      </aside>
    </main>
  );
}
