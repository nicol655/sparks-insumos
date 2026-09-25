"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

import { ButtonPrimary } from "@/components/primitives/button-primary";
import { TextInput } from "@/components/primitives/text-input";
import type { Locale } from "@/i18n/locales";
import type { ActionFailure } from "@/lib/auth/actions";
import type { UserPublic } from "@/lib/auth/contract";
import { validateProfile, type ProfileInput } from "@/lib/auth/validate";
import { useFocusTrap, useScrollLock } from "@/lib/ui/overlay";
import { useUiStore } from "@/lib/ui/store";

export type SaveProfile = (
  input: ProfileInput & { locale: Locale },
) => Promise<ActionFailure | { ok: true; user: UserPublic }>;

const FIELD_MESSAGE = {
  first_name: "firstNameInvalid",
  last_name: "lastNameInvalid",
  email: "emailInvalid",
  phone: "phoneInvalid",
  email_taken: "emailTaken",
} as const;

/**
 * Profile editor (spec 008 RF-7). Same mechanics as the cart drawer, at the
 * prototype width. A filled password never reaches the action.
 */
export function ProfileDrawer({
  user,
  onClose,
  onSaved,
  action,
}: {
  user: UserPublic;
  onClose: () => void;
  onSaved: (user: UserPublic) => void;
  action: SaveProfile;
}) {
  const t = useTranslations("account");
  const panelRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState<string | null>(null);

  useFocusTrap(panelRef, { active: true, onEscape: onClose });
  useScrollLock(true);

  useEffect(() => {
    useUiStore.getState().close();
  }, []);

  return (
    <div className="fixed inset-0 z-[101]">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-[rgb(20_16_14/0.5)]" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-drawer-title"
        className="animate-slide-in bg-canvas absolute top-0 right-0 flex h-full w-[min(460px,94vw)] flex-col"
      >
        <div className="flex flex-col gap-2 px-6 py-5">
          <p className="font-sans text-label tracking-[0.14em] uppercase">{t("edit")}</p>
          <h2 id="profile-drawer-title" className="font-display text-[32px] leading-[1.05]">
            {t("editTitle")}
          </h2>
          <p className="text-text-muted text-[14px] leading-[1.6] font-light">{t("editBody")}</p>
        </div>
        <ProfileForm
          user={user}
          code={code}
          onCode={setCode}
          onClose={onClose}
          onSaved={onSaved}
          action={action}
        />
      </div>
    </div>
  );
}

function ProfileForm({
  user,
  code,
  onCode,
  onClose,
  onSaved,
  action,
}: {
  user: UserPublic;
  code: string | null;
  onCode: (code: string | null) => void;
  onClose: () => void;
  onSaved: (user: UserPublic) => void;
  action: SaveProfile;
}) {
  const locale = useLocale() as Locale;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: ProfileInput = {
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      password: String(data.get("password") ?? ""),
    };
    const issue = validateProfile(input);
    if (issue) {
      onCode(issue);
      return;
    }
    const result = await action({ ...input, locale });
    if (!result.ok) {
      onCode(result.code);
      return;
    }
    onSaved(result.user);
  }

  return (
    <form className="flex flex-1 flex-col" onSubmit={onSubmit}>
      <div className="grid flex-1 grid-cols-1 content-start gap-x-4 gap-y-[18px] overflow-y-auto px-6 md:grid-cols-2">
        <ProfileFields user={user} />
        <PasswordHint />
      </div>
      <ProfileFooter code={code} onClose={onClose} />
    </form>
  );
}

function PasswordHint() {
  const t = useTranslations("account");
  return (
    <p className="text-text-meta text-[12.5px] leading-[1.6] font-light md:col-span-2">{t("passwordHint")}</p>
  );
}

function ProfileFooter({ code, onClose }: { code: string | null; onClose: () => void }) {
  const t = useTranslations("account");
  const auth = useTranslations("auth");
  const field =
    code && code in FIELD_MESSAGE ? auth(FIELD_MESSAGE[code as keyof typeof FIELD_MESSAGE]) : null;
  const message =
    code === "password_unchanged_here" ? t("passwordUnchanged") : field ? field : code ? t("saveFailed") : null;

  return (
    <div className="border-ink flex flex-col gap-3 border-t px-6 py-5">
      {message ? (
        <p role="alert" className="text-danger text-[14px]">
          {message}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onClose}
          className="border-border-hairline inline-flex min-h-12 items-center justify-center border px-4 font-sans text-label tracking-[0.14em] uppercase lg:min-h-11"
        >
          {t("cancel")}
        </button>
        <div>
          <ButtonPrimary type="submit">{t("save")}</ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

function ProfileFields({ user }: { user: UserPublic }) {
  const t = useTranslations("auth");

  return (
    <>
      <TextInput name="firstName" autoComplete="given-name" label={t("firstName")} defaultValue={user.first_name} />
      <TextInput name="lastName" autoComplete="family-name" label={t("lastName")} defaultValue={user.last_name} />
      <div className="md:col-span-2">
        <TextInput
          name="email"
          type="email"
          autoComplete="email"
          label={t("email")}
          defaultValue={user.email}
        />
      </div>
      <TextInput name="phone" type="tel" autoComplete="tel" label={t("phone")} defaultValue={user.phone} />
      <TextInput
        name="password"
        type="password"
        autoComplete="new-password"
        label={t("password")}
        placeholder={t("passwordPh")}
      />
    </>
  );
}
