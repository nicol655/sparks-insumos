"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { GOLD_INDEX, GOLD_KICKER } from "@/components/primitives/gold-kicker";
import { Link } from "@/i18n/navigation";

const BENEFITS = ["member", "early", "vip", "track"] as const;

const TAB =
  "inline-flex min-h-11 items-center border-b pb-1.5 text-[11px] tracking-[0.18em] uppercase";

/**
 * Shared sign-in / register layout from the prototype (spec 008 RF-1).
 * The form itself is the child, so each route owns its fields.
 */
export function AuthScreen({ mode, children }: { mode: "login" | "register"; children: ReactNode }) {
  const t = useTranslations("auth");
  const login = mode === "login";

  return (
    <main className="grid lg:grid-cols-2">
      <div className="flex max-w-[640px] flex-col justify-center gap-[26px] px-[clamp(20px,4.4vw,64px)] py-[clamp(42px,5.5vw,70px)]">
        <div className="flex gap-[22px]">
          <Link
            href="/ingresar"
            aria-current={login ? "page" : undefined}
            className={[TAB, login ? "border-ink text-ink" : "text-text-meta border-transparent"].join(" ")}
          >
            {t("signInTab")}
          </Link>
          <Link
            href="/registro"
            aria-current={login ? undefined : "page"}
            className={[TAB, login ? "text-text-meta border-transparent" : "border-ink text-ink"].join(" ")}
          >
            {t("registerTab")}
          </Link>
        </div>
        <h1 className="font-display text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.02]">
          {login ? t("loginTitle") : t("registerTitle")}
        </h1>
        <p className="text-text-muted max-w-[44ch] text-[14px] leading-[1.7] font-light">
          {login ? t("loginBody") : t("registerBody")}
        </p>
        {children}
        <p className="text-text-meta text-[11.5px] leading-[1.7] font-light">
          {login ? t("loginFoot") : t("registerFoot")}
        </p>
      </div>

      <AuthClubPanel />
    </main>
  );
}

function AuthClubPanel() {
  const t = useTranslations("home.club");

  return (
    <aside className="bg-ink text-canvas flex flex-col justify-center gap-[22px] px-[clamp(20px,4.4vw,56px)] py-[clamp(42px,5.5vw,70px)]">
      <p className={GOLD_KICKER}>{t("kicker")}</p>
      <h2 className="font-display text-[clamp(1.5rem,3.6vw,2.5rem)] leading-[1.05]">{t("title")}</h2>
      <ul>
        {BENEFITS.map((key, index) => (
          <li key={key} className="border-canvas/16 flex items-baseline gap-[18px] border-t py-[18px]">
            <span className={GOLD_INDEX}>{String(index + 1).padStart(2, "0")}</span>
            <span className="flex flex-col gap-1">
              <span className="font-display text-[22px]">{t(`${key}Title`)}</span>
              <span className="text-[12.5px] font-light text-canvas/70">{t(`${key}Body`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
