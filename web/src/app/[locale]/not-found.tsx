import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** Minimal for now; the designed treatment comes with the polish phase. */
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="px-gutter flex flex-1 flex-col justify-center gap-6 py-24">
      <h1 className="text-h2 font-display">{t("title")}</h1>
      <p className="text-body-m text-text-muted max-w-prose">{t("body")}</p>
      <Link href="/" className="text-label uppercase underline underline-offset-4">
        {t("backHome")}
      </Link>
    </main>
  );
}
