import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ContactPage } from "@/components/contact/contact-page";
import { routing } from "@/i18n/routing";
import { seoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contacto">): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "contact" });
  const meta = await getTranslations({ locale: resolved, namespace: "metadata" });

  return seoMetadata({
    locale: resolved,
    pathname: "/contacto",
    title: t("title"),
    description: meta("description"),
  });
}

export default async function ContactRoute({ params }: PageProps<"/[locale]/contacto">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return <ContactPage />;
}
