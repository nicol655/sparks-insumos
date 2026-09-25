"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { BUTTON_TYPE, TOUCH_TARGET } from "@/components/primitives/button-base";
import type { Locale } from "@/i18n/locales";
import { useFocusTrap, useScrollLock } from "@/lib/ui/overlay";
import { useUiStore } from "@/lib/ui/store";

export type DeleteAccount = (locale: Locale) => Promise<{ ok: false; code: string } | void>;

/**
 * Irreversible delete confirmation (spec 008 RF-8).
 * Escape and Cancel dismiss it. A failed delete stays open.
 */
export function DeleteAccountDialog({ onClose, action }: { onClose: () => void; action: DeleteAccount }) {
  const t = useTranslations("account");
  const locale = useLocale() as Locale;
  const panelRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useFocusTrap(panelRef, { active: true, onEscape: onClose });
  useScrollLock(true);

  useEffect(() => {
    useUiStore.getState().close();
  }, []);

  async function confirm() {
    const result = await action(locale);
    if (result && result.ok === false) setFailed(true);
  }

  return (
    <div className="fixed inset-0 z-[103]">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 z-[102] bg-[rgb(20_16_14/0.5)]" />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="bg-canvas absolute top-1/2 left-1/2 z-[103] flex w-[min(480px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 p-8"
      >
        <p className="font-mono text-[10px] leading-none tracking-[0.2em] text-danger uppercase">
          {t("deleteKicker")}
        </p>
        <h2 id="delete-account-title" className="font-display text-[32px] leading-[1.05]">
          {t("deleteTitle")}
        </h2>
        <p className="text-text-muted text-[14px] leading-[1.7] font-light">{t("deleteBody")}</p>
        <div className="flex flex-col gap-3">
          {failed ? (
            <p role="alert" className="text-danger text-[14px]">
              {t("deleteFailed")}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className={[
                BUTTON_TYPE,
                TOUCH_TARGET,
                "border-border-hairline inline-flex items-center justify-center border px-4 tracking-[0.14em]",
              ].join(" ")}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              className={[
                BUTTON_TYPE,
                TOUCH_TARGET,
                "bg-danger text-canvas hover:bg-danger inline-flex items-center justify-center px-4 tracking-[0.14em]",
              ].join(" ")}
            >
              {t("deleteConfirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
