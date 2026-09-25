import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AuthScreen } from "@/components/auth/auth-screen";
import { RegisterForm } from "@/components/auth/register-form";
import { routing } from "@/i18n/routing";
import { registerAction } from "@/lib/auth/server-actions";
import { seoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/registro">): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "auth" });

  return seoMetadata({
    locale: resolved,
    pathname: "/registro",
    title: t("registerMetaTitle"),
    description: t("registerMetaDescription"),
  });
}

export default async function RegisterPage({ params }: PageProps<"/[locale]/registro">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <AuthScreen mode="register">
      <RegisterForm action={registerAction} />
    </AuthScreen>
  );
}
