"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { copy } from "@/copy/es";
import { createLoginAction, type LoginResult } from "@/lib/auth/actions";
import { createLoginClient } from "@/lib/auth/client";
import type { LoginRequest } from "@/lib/auth/contract";
import { useSessionStore } from "@/lib/auth/session-store";

export type LoginHandler = (input: LoginRequest) => Promise<LoginResult>;

const defaultLogin = createLoginAction(createLoginClient());

const fieldClass =
  "min-h-11 w-full border border-border-strong bg-surface-raised px-3 text-sm text-ink outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function LoginForm({ login = defaultLogin }: { login?: LoginHandler }) {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    if (!email || !password) {
      setError(copy.missingFields);
      return;
    }

    const result = await login({ email, password });
    if (!result.ok) {
      const message =
        result.code === "invalid_credentials"
          ? copy.invalidCredentials
          : result.code === "forbidden"
            ? copy.forbidden
            : copy.unavailable;
      setError(message);
      return;
    }

    setSession(result.accessToken, result.mustChangePassword);
    router.push("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2 text-[11px] tracking-[0.16em] text-text-meta uppercase">
        {copy.emailLabel}
        <input
          name="email"
          type="email"
          autoComplete="username"
          placeholder={copy.emailPlaceholder}
          className={fieldClass}
        />
      </label>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-[11px] tracking-[0.16em] text-text-meta uppercase"
        >
          {copy.passwordLabel}
        </label>
        <span className="relative">
          <input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            className={`${fieldClass} pr-12`}
          />
          <button
            type="button"
            className="absolute top-1/2 right-2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-text-meta"
            aria-pressed={visible}
            aria-label={visible ? copy.hidePassword : copy.showPassword}
            onClick={() => setVisible((current) => !current)}
          >
            <EyeIcon />
          </button>
        </span>
      </div>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="bg-ink text-canvas hover:bg-accent-gold active:bg-accent-gold-pressed min-h-11 w-full text-[11px] tracking-[0.18em] uppercase"
      >
        {copy.submit}
      </button>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M1.5 9S4.2 4.5 9 4.5 16.5 9 16.5 9 13.8 13.5 9 13.5 1.5 9 1.5 9Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
