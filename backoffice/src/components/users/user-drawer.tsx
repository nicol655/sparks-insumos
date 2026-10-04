"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import type { Account } from "@/lib/users/contract";
import {
  createBody,
  missingField,
  patchBody,
  type UserCreateBody,
  type UserDraft,
  type UserPatchBody,
} from "@/lib/users/form";
import {
  DELETE_BODY,
  DELETE_UNAVAILABLE,
  PASSWORD_HINT,
  SENSITIVE_BODY,
  formatAlta,
} from "@/lib/users/labels";

const labelClass = "text-text-meta font-mono text-[9.5px] tracking-[0.14em] uppercase";
const fieldClass =
  "border-border-strong text-ink w-full min-w-0 border-0 border-b bg-transparent px-0.5 py-2.5 text-[14.5px] outline-none";
const buttonMotion = "cursor-pointer transition-colors duration-150";

function useClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-[7px] ${full ? "sm:col-span-2" : ""}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function UserDrawer({
  account,
  onClose,
  onCreate,
  onUpdate,
}: {
  account: Account | null;
  onClose: () => void;
  onCreate: (body: UserCreateBody) => Promise<string | null>;
  onUpdate: (id: string, body: UserPatchBody) => Promise<string | null>;
}) {
  const mounted = useClient();
  const editing = account !== null;
  const [firstName, setFirstName] = useState(account?.first_name ?? "");
  const [lastName, setLastName] = useState(account?.last_name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"activa" | "bloqueada">(account?.active === false ? "bloqueada" : "activa");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cannotDelete, setCannotDelete] = useState(false);

  const draft = (): UserDraft => ({ firstName, lastName, email, phone, password });
  const title = `${firstName} ${lastName}`.trim() || "Sin nombre";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (confirming) {
        setConfirming(false);
        return;
      }
      onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirming, onClose]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const gap = missingField(draft(), editing ? "edit" : "create");
    if (gap) {
      setError(gap);
      return;
    }
    setError(null);
    const detail = editing
      ? await onUpdate(account.id, patchBody(draft(), status === "activa"))
      : await onCreate(createBody(draft()));
    if (detail) setError(detail);
  }

  if (!mounted) return null;

  const panel = (
    <form onSubmit={onSubmit} className="flex min-h-full flex-col" noValidate>
      <div className="border-ink/14 flex items-start justify-between gap-4 border-b px-[26px] py-[22px]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-accent-gold font-mono text-[9.5px] tracking-[0.2em] uppercase">
            {editing ? `Cliente · alta ${formatAlta(account.created_at)}` : "Nuevo cliente"}
          </p>
          <p id="user-drawer-title" className="font-display text-[30px] leading-none">
            {title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className={`${buttonMotion} text-ink -mt-2 -mr-3 flex size-11 items-center justify-center text-[20px]`}
        >
          ×
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-[26px] overflow-y-auto px-[26px] py-6 pb-[34px]">
        {editing ? (
          <div className="border-ink/12 bg-ink/12 grid grid-cols-3 gap-px border">
            {["Pedidos", "Total gastado", "Ticket medio"].map((label) => (
              <div key={label} className="bg-canvas flex flex-col gap-[5px] px-4 py-3.5">
                <span className="text-text-meta font-mono text-[9px] tracking-[0.14em] uppercase">{label}</span>
                <span className="font-display text-[22px]">—</span>
              </div>
            ))}
          </div>
        ) : null}
        <section className="flex flex-col gap-4">
          <h2 className="border-ink/14 border-b pb-2.5 text-[10.5px] font-medium tracking-[0.16em] uppercase">
            Datos personales
          </h2>
          <div className="grid gap-x-4 gap-y-[18px] sm:grid-cols-2">
            <Field label="Nombre">
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className={fieldClass} />
            </Field>
            <Field label="Apellido">
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} className={fieldClass} />
            </Field>
            <Field label="Email" full>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} />
            </Field>
            <Field label="Nueva contraseña">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={fieldClass}
              />
              {editing ? <span className="text-text-meta text-[11.5px] font-light">{PASSWORD_HINT}</span> : null}
            </Field>
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="border-ink/14 border-b pb-2.5 text-[10.5px] font-medium tracking-[0.16em] uppercase">
            Cuenta
          </h2>
          <div className="grid gap-x-4 gap-y-[18px] sm:grid-cols-2">
            <Field label="Nivel">
              <select defaultValue="invitado" className={`${fieldClass} ${buttonMotion}`}>
                <option value="club">Sparks Club · 5% off</option>
                <option value="invitado">Invitado</option>
              </select>
            </Field>
            <Field label="Estado">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value === "bloqueada" ? "bloqueada" : "activa")}
                className={`${fieldClass} ${buttonMotion}`}
              >
                <option value="activa">Activa</option>
                <option value="bloqueada">Bloqueada</option>
              </select>
            </Field>
            <Field label="Notas internas" full>
              <textarea
                rows={3}
                placeholder="Preferencias, historial de reclamos…"
                className="border-ink/24 text-ink w-full resize-y border bg-transparent p-3 text-sm leading-relaxed outline-none"
              />
            </Field>
          </div>
        </section>
        {editing ? (
          <div className="flex flex-col gap-3 border border-[rgba(180,68,58,0.35)] px-5 py-[18px]">
            <span className="font-mono text-[9.5px] tracking-[0.16em] text-[#B4443A] uppercase">Zona sensible</span>
            <p className="text-text-muted text-[13px] leading-relaxed font-light">{SENSITIVE_BODY}</p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setStatus(status === "bloqueada" ? "activa" : "bloqueada")}
                className={`${buttonMotion} border-ink/28 hover:border-ink text-ink border px-[18px] py-[11px] text-[10.5px] tracking-[0.16em] uppercase`}
              >
                {status === "bloqueada" ? "Desbloquear" : "Bloquear"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className={`${buttonMotion} border border-[rgba(180,68,58,0.45)] px-[18px] py-[11px] text-[10.5px] tracking-[0.16em] text-[#B4443A] uppercase hover:border-[#B4443A] hover:bg-[#B4443A] hover:text-[#F5F1EA]`}
              >
                Eliminar cuenta
              </button>
            </div>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}
        {cannotDelete ? (
          <p role="alert" className="text-danger text-sm">
            {DELETE_UNAVAILABLE}
          </p>
        ) : null}
      </div>
      <div className="border-ink flex items-center gap-2.5 border-t px-[26px] py-[18px]">
        <div className="ml-auto flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className={`${buttonMotion} border-ink/28 text-ink hover:border-ink border px-[22px] py-3.5 text-[11px] tracking-[0.16em] uppercase`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`${buttonMotion} bg-ink text-canvas hover:bg-accent-gold px-6 py-3.5 text-[11px] tracking-[0.16em] uppercase`}
          >
            {editing ? "Guardar" : "Crear cliente"}
          </button>
        </div>
      </div>
    </form>
  );

  return createPortal(
    <>
      <div className="bg-ink/50 fixed inset-0 z-[100]" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-drawer-title"
        className="bg-canvas border-ink/14 animate-slide-in motion-reduce:animate-none fixed inset-y-0 right-0 z-[101] flex w-[560px] max-w-full flex-col border-l"
      >
        {panel}
      </aside>
      {confirming ? (
        <>
          <div className="bg-ink/55 fixed inset-0 z-[110]" onClick={() => setConfirming(false)} />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="bg-canvas border-ink/14 animate-fade-up motion-reduce:animate-none fixed top-1/2 left-1/2 z-[111] flex w-[480px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3.5 border px-[30px] pt-8 pb-[26px]"
          >
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#B4443A] uppercase">Acción irreversible</span>
            <p id="delete-user-title" className="font-display text-[30px] leading-none">
              {`¿Eliminar a ${firstName} ${lastName}?`}
            </p>
            <p className="text-text-muted text-[13.5px] leading-relaxed font-light">{DELETE_BODY}</p>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className={`${buttonMotion} border-ink/28 text-ink border px-3.5 py-3.5 text-[11px] tracking-[0.16em] uppercase`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setCannotDelete(true);
                }}
                className={`${buttonMotion} bg-[#B4443A] px-3.5 py-3.5 text-[11px] tracking-[0.16em] text-[#F5F1EA] uppercase hover:bg-[#92352D]`}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>,
    document.body,
  );
}
