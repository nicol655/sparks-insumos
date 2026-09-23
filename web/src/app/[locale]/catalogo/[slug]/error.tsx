"use client";

import { useTranslations } from "next-intl";

import { ButtonPrimary } from "@/components/primitives/button-primary";

export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  return (
    <main className="px-gutter py-section">
      <div className="flex flex-col items-start gap-5">
        <h1 className="text-h1-page font-display">{t("product.errorTitle")}</h1>
        <p className="text-body-m text-text-muted max-w-prose">{t("product.errorBody")}</p>
        <ButtonPrimary onClick={reset}>{t("catalog.retry")}</ButtonPrimary>
      </div>
    </main>
  );
}
