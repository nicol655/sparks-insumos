import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountView } from "@/components/account/account-view";
import { routing } from "@/i18n/routing";
import { deleteAccountAction, loadAccountAction, logoutAction, patchMeAction } from "@/lib/auth/server-actions";
import { seoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cuenta">): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "account" });

  return seoMetadata({
    locale: resolved,
    pathname: "/cuenta",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function AccountPage({ params }: PageProps<"/[locale]/cuenta">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const result = await loadAccountAction(locale);

  if (!result.ok) {
    return (
      <AccountView
        user={null}
        notice={result.code === "password_change_required" ? "locked" : "unavailable"}
        logout={logoutAction}
      />
    );
  }

  return (
    <AccountView user={result.user} logout={logoutAction} save={patchMeAction} remove={deleteAccountAction} />
  );
}
