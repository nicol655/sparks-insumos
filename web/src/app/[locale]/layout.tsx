import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartHydration } from "@/components/layout/cart-hydration";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SearchOverlay } from "@/components/search/search-overlay";
import { SkipLink } from "@/components/layout/skip-link";
import { ToastHost } from "@/components/layout/toast-host";
import { WhatsappFab } from "@/components/layout/whatsapp-fab";
import { INTL_LOCALE } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";
import { seoMetadata } from "@/lib/seo";
import { fontVariables } from "@/styles/fonts";

import "../globals.css";

/** Both locales are known up front, so both trees prerender. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "metadata" });

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    description: t("description"),
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    ...seoMetadata({
      locale: resolved,
      pathname: "/",
      title: t("title"),
      description: t("description"),
    }),
    title: t("title"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  // The middleware only lets known locales through, but a direct render of an
  // unknown param would otherwise fall back to Spanish silently.
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <html lang={INTL_LOCALE[locale]} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <CartHydration />
          <SkipLink />
          <AnnouncementBar />
          <Header />
          <MobileMenu />
          <SearchOverlay />
          <CartDrawer />
          <ToastHost />
          <div id="contenido" className="flex flex-1 flex-col">
            {children}
          </div>
          <Footer />
          <WhatsappFab />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
