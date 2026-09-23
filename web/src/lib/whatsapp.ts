import { env } from "@/lib/env";

/**
 * §06 · "Enlaces wa.me con el número 5491168692694 y mensaje precargado según
 * contexto. Codificar el texto con encodeURIComponent."
 *
 * The message itself is not built here: it comes from the i18n dictionary so
 * it can be translated (RF-7). This module only assembles the link.
 */
const WA_ORIGIN = "https://wa.me";

export type WhatsappLink = {
  /** Fully composed, already translated message. */
  message: string;
  /** Digits only. Defaults to the business number from the environment. */
  phone?: string;
};

export function buildWhatsappUrl({ message, phone }: WhatsappLink): string {
  const number = phone ?? env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  if (!/^\d{8,15}$/.test(number)) {
    throw new Error(`Invalid WhatsApp number "${number}": expected 8 to 15 digits`);
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new Error("A WhatsApp link needs a preloaded message");
  }

  return `${WA_ORIGIN}/${number}?text=${encodeURIComponent(trimmed)}`;
}

/** Order body: intro, one line per bottle, total. Newlines survive encoding. */
export function buildOrderMessage(intro: string, lines: string[], total: string): string {
  return [intro, ...lines, total].join("\n");
}
