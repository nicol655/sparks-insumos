"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

import { WhatsappDot, XIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NAV_KEY, PRIMARY_NAV } from "@/components/layout/nav";
import { BUTTON_TYPE, TOUCH_TARGET } from "@/components/primitives/button-base";
import { Link } from "@/i18n/navigation";
import { useFocusTrap, useScrollLock } from "@/lib/ui/overlay";
import { useUiStore } from "@/lib/ui/store";
import { buildWhatsappUrl } from "@/lib/whatsapp";

/**
 * §03 / T043 · full-screen menu below 900px.
 *
 * Links are Cormorant 30px with a hairline divider. Language and account live
 * here on mobile (they hide from the header). The WhatsApp CTA sits at the
 * foot. Focus is trapped; Escape closes and the hook restores it to the
 * hamburger that opened the panel.
 */

const MENU_LINK =
  "font-display text-[30px] leading-none text-ink py-5 border-b border-border-hairline " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function MobileMenu() {
  const t = useTranslations();
  const overlay = useUiStore((state) => state.overlay);
  const close = useUiStore((state) => state.close);
  const open = overlay === "menu";
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, { active: open, onEscape: close });
  useScrollLock(open);

  if (!open) return null;

  const whatsappHref = buildWhatsappUrl({ message: t("whatsapp.general") });

  return (
    <div
      ref={panelRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
      className="bg-canvas fixed inset-0 z-[110] flex flex-col px-gutter py-6 lg:hidden"
    >
      <div className="flex items-center justify-between">
        <h2 id="mobile-menu-title" className="font-sans text-label tracking-[0.14em] uppercase">
          {t("header.menu")}
        </h2>
        <button
          type="button"
          aria-label={t("header.closeMenu")}
          onClick={close}
          className="flex h-11 w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <XIcon />
        </button>
      </div>

      <nav aria-label={t("nav.label")} className="mt-10 flex flex-col">
        {PRIMARY_NAV.map((item) => (
          <Link key={item.key} href={item.href} className={MENU_LINK} onClick={close}>
            {t(NAV_KEY[item.key])}
          </Link>
        ))}
        <Link href="/ingresar" className={MENU_LINK} onClick={close}>
          {t("header.signIn")}
        </Link>
      </nav>

      <div className="mt-8">
        <LanguageSwitcher />
      </div>

      <a
        href={whatsappHref}
        className={[
          BUTTON_TYPE,
          TOUCH_TARGET,
          "mt-auto inline-flex items-center justify-center gap-2 bg-ink px-[30px] py-[17px]",
          "tracking-[0.2em] text-canvas hover:bg-accent-gold",
          "focus-visible:outline-ink",
        ].join(" ")}
      >
        <WhatsappDot />
        {t("whatsapp.floatingLabel")}
      </a>
    </div>
  );
}
