"use client";

import { useTranslations } from "next-intl";

import { ButtonPrimary } from "@/components/primitives/button-primary";

type Props = {
  onRetry: () => void;
};

/**
 * T065 · RF-1. Catalogue fetch failed: say so, and offer a retry rather than
 * an empty grid that looks like a filter miss.
 */
export function ErrorState({ onRetry }: Props) {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-start gap-5">
      <h1 className="text-h1-page font-display">{t("catalog.errorTitle")}</h1>
      <p className="text-body-m text-text-muted max-w-prose">{t("catalog.errorBody")}</p>
      <ButtonPrimary onClick={onRetry}>{t("catalog.retry")}</ButtonPrimary>
    </div>
  );
}
