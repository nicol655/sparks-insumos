import { render, renderHook, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import type { Locale } from "@/i18n/locales";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";

const MESSAGES = { es, en } as const;

type Options = Omit<RenderOptions, "wrapper"> & { locale?: Locale };

function IntlWrapper({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="America/Argentina/Buenos_Aires"
    >
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * Renders a tree the way the locale layout does: inside a next-intl provider
 * so `useTranslations` and `useLocale` resolve. Navigation (Link, useRouter)
 * is still the real module unless the suite mocks `@/i18n/navigation`.
 */
export function renderWithIntl(ui: ReactElement, { locale = "es", ...options }: Options = {}) {
  return render(ui, {
    wrapper: ({ children }) => <IntlWrapper locale={locale}>{children}</IntlWrapper>,
    ...options,
  });
}

export function renderHookWithIntl<T>(
  callback: () => T,
  { locale = "es" }: { locale?: Locale } = {},
) {
  return renderHook(callback, {
    wrapper: ({ children }) => <IntlWrapper locale={locale}>{children}</IntlWrapper>,
  });
}
