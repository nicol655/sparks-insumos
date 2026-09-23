import type messages from "@/i18n/messages/es.json";
import type { routing } from "@/i18n/routing";

/**
 * Makes translation keys and locales type-safe: `t('nav.catalgo')` stops being
 * a runtime surprise, and the English dictionary is checked against the
 * Spanish one by the parity test in src/i18n/__tests__.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
