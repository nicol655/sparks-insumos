"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

import { ButtonPrimary } from "@/components/primitives/button-primary";
import { TextInput } from "@/components/primitives/text-input";
import type { ActionFailure } from "@/lib/auth/actions";
import { validateRegister, type RegisterInput } from "@/lib/auth/validate";
import type { Locale } from "@/i18n/locales";

export type RegisterAction = (
  input: RegisterInput & { locale: Locale },
) => Promise<ActionFailure | void>;

const FIELD_MESSAGE = {
  first_name: "firstNameInvalid",
  last_name: "lastNameInvalid",
  email: "emailInvalid",
  phone: "phoneInvalid",
  password: "passwordInvalid",
  email_taken: "emailTaken",
} as const;

/**
 * Register fields. DTO rules run here before the action, and again inside it.
 * One alert sits directly above «Crear cuenta» (spec 008 RF-3).
 */
export function RegisterForm({ action }: { action: RegisterAction }) {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const [code, setCode] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: RegisterInput = {
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      password: String(data.get("password") ?? ""),
    };
    const issue = validateRegister(input);
    if (issue) {
      setCode(issue);
      return;
    }
    const result = await action({ ...input, locale });
    setCode(result && !result.ok ? result.code : null);
  }

  const messageKey =
    code && code in FIELD_MESSAGE ? FIELD_MESSAGE[code as keyof typeof FIELD_MESSAGE] : null;
  const message = messageKey ? t(messageKey) : code ? t("registerFailed") : null;

  return (
    <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <TextInput name="firstName" autoComplete="given-name" label={t("firstName")} placeholder={t("firstNamePh")} />
      <TextInput name="lastName" autoComplete="family-name" label={t("lastName")} placeholder={t("lastNamePh")} />
      <div className="md:col-span-2">
        <TextInput
          name="email"
          type="email"
          autoComplete="email"
          label={t("email")}
          placeholder={t("emailPh")}
        />
      </div>
      <TextInput
        name="phone"
        type="tel"
        autoComplete="tel"
        label={t("phone")}
        placeholder={t("phonePh")}
      />
      <TextInput
        name="password"
        type="password"
        autoComplete="new-password"
        label={t("password")}
        placeholder={t("passwordPh")}
      />
      <div className="flex flex-col gap-2 md:col-span-2">
        {message ? (
          <p role="alert" className="text-danger text-[14px]">
            {message}
          </p>
        ) : null}
        <div>
          <ButtonPrimary type="submit">{t("registerSubmit")}</ButtonPrimary>
        </div>
      </div>
    </form>
  );
}
