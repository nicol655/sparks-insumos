import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AuthScreen } from "@/components/auth/auth-screen";
import { LoginForm } from "@/components/auth/login-form";
import { routing } from "@/i18n/routing";
import { loginAction } from "@/lib/auth/server-actions";
import { seoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/ingresar">): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "auth" });

  return seoMetadata({
    locale: resolved,
    pathname: "/ingresar",
    title: t("loginMetaTitle"),
    description: t("loginMetaDescription"),
  });
}

export default async function SignInPage({
  params,
  searchParams,
}: PageProps<"/[locale]/ingresar">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const query = await searchParams;
  const next = typeof query.next === "string" ? query.next : null;

  return (
    <AuthScreen mode="login">
      <LoginForm next={next} action={loginAction} />
    </AuthScreen>
  );
}
