import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CartView } from "@/components/cart/cart-view";
import { routing } from "@/i18n/routing";
import { seoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/carrito">): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "cart" });
  const meta = await getTranslations({ locale: resolved, namespace: "metadata" });

  return seoMetadata({
    locale: resolved,
    pathname: "/carrito",
    title: t("title"),
    description: meta("description"),
  });
}

export default async function CartPage({ params }: PageProps<"/[locale]/carrito">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="px-gutter py-section">
      <h1 className="text-h1-page font-display mb-10">{t("cart.title")}</h1>
      <CartView />
    </main>
  );
}
