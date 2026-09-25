"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  DeleteAccountDialog,
  type DeleteAccount,
} from "@/components/account/delete-account-dialog";
import { ProfileDrawer, type SaveProfile } from "@/components/account/profile-drawer";
import type { Locale } from "@/i18n/locales";
import type { UserPublic } from "@/lib/auth/contract";

export type AccountNotice = "locked" | "unavailable";

/** Prototype account buttons: 11px, tracking 0.16em, padding 13×22. No min-height. */
const ACCOUNT_ACTION = [
  "font-sans text-[11px] font-normal tracking-[0.16em] uppercase",
  "inline-flex items-center justify-center border px-[22px] py-[13px]",
  "transition-colors",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
].join(" ");

/**
 * Account page body (spec 009).
 *
 * Cards that `GET /me` does not provide stay as a hyphen. Orders stay empty
 * until an orders API exists (ADR-0013).
 *
 * The column stays 1180px until a wider screen would push the side gap
 * past the design capture. From there it grows (`62vw` plus the 64px
 * gutters) so the content stays about 19% in from each screen edge.
 */
export function AccountView({
  user,
  notice,
  logout,
  save,
  remove,
}: {
  user: UserPublic | null;
  notice?: AccountNotice;
  logout: (locale: Locale) => Promise<unknown>;
  save?: SaveProfile;
  remove?: DeleteAccount;
}) {
  const t = useTranslations("account");
  const locale = useLocale() as Locale;
  const [current, setCurrent] = useState(user);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const shown = current;
  const blocked = notice !== undefined || shown === null;

  return (
    <main className="mx-auto flex w-[min(100%,max(1180px,calc(62vw+128px)))] flex-col gap-[34px] px-[clamp(20px,4.4vw,64px)] pt-[clamp(34px,4vw,56px)] pb-[clamp(64px,8vw,110px)]">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-[10px]">
          {shown && !notice ? (
            <p className="text-accent-gold font-mono text-[10px] tracking-[0.22em] uppercase">
              {t("memberSince", { year: String(new Date(shown.created_at).getUTCFullYear()) })}
            </p>
          ) : null}
          <h1 className="font-display text-[clamp(32px,4.2vw,52px)] font-normal">
            {shown && !notice ? t("hello", { name: shown.first_name }) : t("helloLocked")}
          </h1>
          {notice === "locked" ? (
            <div className="flex max-w-[48ch] flex-col gap-2">
              <p className="text-[16px]">{t("lockedTitle")}</p>
              <p className="text-text-muted text-[14px] leading-[1.7] font-light">
                {t("lockedBody")}
              </p>
            </div>
          ) : null}
          {notice === "unavailable" ? (
            <p role="alert" className="text-danger text-[14px]">
              {t("loadFailed")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-[10px]">
          {shown && !blocked && save ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={`${ACCOUNT_ACTION} border-ink bg-ink text-canvas hover:border-accent-gold hover:bg-accent-gold`}
            >
              {t("edit")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void logout(locale)}
            className={`${ACCOUNT_ACTION} border-border-strong text-ink hover:border-ink`}
          >
            {t("logout")}
          </button>
          {shown && !blocked ? (
            <button
              type="button"
              onClick={() => {
                if (!remove) return;
                setEditing(false);
                setConfirming(true);
              }}
              className={`${ACCOUNT_ACTION} border-danger/45 text-danger hover:bg-danger hover:text-canvas`}
            >
              {t("delete")}
            </button>
          ) : null}
        </div>
      </header>

      {shown && !blocked ? (
        <>
          <section className="border-border-hairline bg-border-hairline grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-px border">
            <AccountCard label={t("tierLabel")} value={t("missing")} note={t("tierNote")} />
            <AccountCard label={t("couponLabel")} value={t("missing")} note={t("couponNote")} />
            <AccountCard
              label={t("ordersCountLabel")}
              value={t("missing")}
              note={t("ordersCountNote")}
            />
          </section>
          <section>
            <h2 className="font-display mb-[18px] text-[32px] font-normal">{t("ordersTitle")}</h2>
            <div className="border-ink border-t">
              <p className="border-border-hairline border-b py-[18px] text-left font-sans text-[13.5px] leading-normal font-light not-italic">
                {t("ordersEmpty")}
              </p>
            </div>
          </section>
        </>
      ) : null}

      {confirming && remove ? (
        <DeleteAccountDialog action={remove} onClose={() => setConfirming(false)} />
      ) : null}

      {editing && shown && save ? (
        <ProfileDrawer
          user={shown}
          action={save}
          onClose={() => setEditing(false)}
          onSaved={(next) => {
            setCurrent(next);
            setEditing(false);
          }}
        />
      ) : null}
    </main>
  );
}

function AccountCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="bg-canvas flex flex-col gap-2 px-7 py-7">
      <p className="text-text-meta font-mono text-[9.5px] tracking-[0.16em] uppercase">{label}</p>
      <p className="font-display text-[32px] break-words">{value}</p>
      <p className="text-text-muted text-[12.5px] font-light">{note}</p>
    </article>
  );
}
