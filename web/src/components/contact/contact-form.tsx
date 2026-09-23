"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";

import { BoxedTextArea } from "@/components/primitives/boxed-input";
import { ButtonPrimary } from "@/components/primitives/button-primary";
import { TextInput } from "@/components/primitives/text-input";

const FIELDS = [
  { key: "name", type: "text", autoComplete: "name" },
  { key: "phone", type: "tel", autoComplete: "tel" },
  { key: "email", type: "email", autoComplete: "email" },
  { key: "subject", type: "text", autoComplete: "off" },
] as const;

/**
 * 004 · contact form. Looks like the prototype; submit is a no-op until
 * the API exists.
 */
export function ContactForm() {
  const t = useTranslations("contact");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      {FIELDS.map((field) => (
        <TextInput
          key={field.key}
          name={field.key}
          label={t(field.key)}
          placeholder={t(`${field.key}Ph`)}
          autoComplete={field.autoComplete}
          type={field.type}
        />
      ))}
      <div className="md:col-span-2">
        <BoxedTextArea name="message" label={t("message")} placeholder={t("messagePh")} rows={4} />
      </div>
      <div className="md:col-span-2">
        <ButtonPrimary type="submit">{t("send")}</ButtonPrimary>
      </div>
    </form>
  );
}
