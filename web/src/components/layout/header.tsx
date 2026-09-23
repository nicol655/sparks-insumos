"use client";

import { useTranslations } from "next-intl";

import { MenuGlyph, ShoppingBagIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NAV_KEY, PRIMARY_NAV } from "@/components/layout/nav";
import { Wordmark } from "@/components/layout/wordmark";
import { SearchTrigger } from "@/components/search/search-trigger";

import { Link } from "@/i18n/navigation";
import { cartCount, useCartStore } from "@/lib/cart/store";
import { useUiStore } from "@/lib/ui/store";

/**
 * §03 · sticky header, 74px, three-zone grid.
 *
 * Desktop: `1fr auto 1fr` (nav · wordmark · utilities).
 * Below 900px: `auto 1fr auto` (hamburger · wordmark · search + cart). Language,
 * account and the search/cart labels hide — they move into the mobile menu
 * (T043).
 */

const HEADER_LINK =
  "font-sans text-label tracking-[0.14em] uppercase text-ink transition-colors " +
  "hover:text-ink/70 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function Header() {
  const t = useTranslations();
  const hydrated = useCartStore((state) => state.hydrated);
  const count = useCartStore((state) => (state.hydrated ? cartCount(state.items) : 0));
  const overlay = useUiStore((state) => state.overlay);
  const open = useUiStore((state) => state.open);
  const toggle = useUiStore((state) => state.toggle);

  return (
    <header
      className={[
        "sticky top-0 z-[60] h-[74px] border-b border-border-hairline",
        "bg-canvas/92 backdrop-blur-[14px]",
      ].join(" ")}
    >
      <div
        className={[
          "px-gutter grid h-full items-center",
          "grid-cols-[auto_minmax(0,1fr)_auto] gap-x-[clamp(10px,2vw,24px)]",
          "lg:grid-cols-[1fr_auto_1fr]",
        ].join(" ")}
      >
        <button
          type="button"
          className={[
            "flex h-11 w-11 items-center justify-center lg:hidden",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          ].join(" ")}
          aria-expanded={overlay === "menu"}
          aria-controls="mobile-menu"
          aria-label={t("header.openMenu")}
          onClick={() => toggle("menu")}
        >
          <MenuGlyph />
        </button>

        <nav aria-label={t("nav.label")} className="hidden items-center gap-7 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.key} href={item.href} className={HEADER_LINK}>
              {t(NAV_KEY[item.key])}
            </Link>
          ))}
        </nav>

        <div className="justify-self-center">
          <Wordmark />
        </div>

        <div className="flex items-center justify-end gap-5">
          <SearchTrigger />

          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          <Link href="/ingresar" className={`${HEADER_LINK} hidden lg:inline`}>
            {t("header.signIn")}
          </Link>

          <button
            type="button"
            id="header-cart"
            data-hydrated={hydrated ? "true" : "false"}
            aria-expanded={overlay === "cart"}
            aria-controls="cart-drawer"
            aria-label={t("header.cartCount", { count })}
            onClick={() => open("cart")}
            className={[
              "inline-flex min-h-11 items-center gap-2 bg-ink px-[14px] py-[10px] text-canvas",
              "font-sans text-label tracking-[0.14em] uppercase",
              "transition-colors hover:bg-accent-gold",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
            ].join(" ")}
          >
            <ShoppingBagIcon className="h-[18px] w-[18px]" />
            <span className="hidden lg:inline">{t("header.cart")}</span>
            {hydrated ? (
              <span className="font-mono text-mono-meta tracking-[0.12em]">{count}</span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
