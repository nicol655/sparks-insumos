"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

import { ButtonPrimary } from "@/components/primitives/button-primary";
import { TextInput } from "@/components/primitives/text-input";
import type { ActionFailure, LoginActionInput } from "@/lib/auth/actions";
import type { Locale } from "@/i18n/locales";

export type LoginAction = (input: LoginActionInput & { locale: Locale }) => Promise<ActionFailure | void>;

/**
 * Sign-in fields. The action redirects on success; a failure is the alert
 * directly above the button (spec 008 RF-2).
 */
export function LoginForm({ next, action }: { next: string | null; action: LoginAction }) {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const [code, setCode] = useState<ActionFailure["code"] | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await action({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      next,
      locale,
    });
    setCode(result && !result.ok ? result.code : null);
  }

  const message =
    code === "invalid_credentials" ? t("invalidCredentials") : code ? t("signInFailed") : null;

  return (
    <form className="grid grid-cols-1 gap-4" onSubmit={onSubmit}>
      <TextInput
        name="email"
        type="email"
        autoComplete="email"
        label={t("email")}
        placeholder={t("emailPh")}
        required
      />
      <TextInput
        name="password"
        type="password"
        autoComplete="current-password"
        label={t("password")}
        placeholder={t("passwordPh")}
        required
      />
      <div className="flex flex-col gap-2">
        {message ? (
          <p role="alert" className="text-danger text-[14px]">
            {message}
          </p>
        ) : null}
        <div>
          <ButtonPrimary type="submit">{t("loginSubmit")}</ButtonPrimary>
        </div>
      </div>
    </form>
  );
}
