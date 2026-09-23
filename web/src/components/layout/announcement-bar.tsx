import { Fragment } from "react";
import { useTranslations } from "next-intl";

import { env } from "@/lib/env";

/**
 * §03 · "Sobre el header, fondo ink, texto canvas, mono 11px tracking 0.18em,
 * padding 9px 20px; desactivable por configuración."
 *
 * The three messages are the volume discounts and the shipping note. They sit
 * on one line from 700px up and stack below it: three mono strings at 0.18em
 * tracking do not fit at 360px, and English runs 15–30% longer (§06).
 */

type Props = {
  /** Defaults to the env flag. Overridable so tests do not have to reload env. */
  enabled?: boolean;
};

export function AnnouncementBar({ enabled = env.NEXT_PUBLIC_ANNOUNCEMENT }: Props) {
  const t = useTranslations("announcement");

  if (!enabled) return null;

  const messages = [t("discountLow"), t("discountHigh"), t("shipping")];

  return (
    <div className="bg-ink text-canvas px-[20px] py-[9px]">
      <p className="text-mono-meta flex flex-col items-center gap-1 font-mono tracking-[0.18em] uppercase md:flex-row md:justify-center md:gap-0">
        {messages.map((message, index) => (
          <Fragment key={message}>
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="bg-canvas/40 mx-3 hidden h-[11px] w-px md:inline-block"
              />
            ) : null}
            <span>{message}</span>
          </Fragment>
        ))}
      </p>
    </div>
  );
}
