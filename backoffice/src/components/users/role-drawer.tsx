"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import type { PermissionRow, RoleStatistics } from "@/lib/roles/contract";
import {
  createRoleBody,
  missingRoleField,
  patchRoleBody,
  permissionsBody,
  type RoleCreateBody,
  type RoleDraft,
  type RolePatchBody,
  type RolePermissionsBody,
} from "@/lib/roles/form";

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

function sameIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const set = new Set(left);
  return right.every((id) => set.has(id));
}

export type RoleDrawerMode = "create" | "edit" | "duplicate";

export function RoleDrawer({
  mode,
  role,
  permissions,
  onClose,
  onCreate,
  onUpdate,
}: {
  mode: RoleDrawerMode;
  role: RoleStatistics | null;
  permissions: PermissionRow[];
  onClose: () => void;
  onCreate: (body: RoleCreateBody) => Promise<string | null>;
  onUpdate: (
    id: string,
    patch: RolePatchBody | null,
    grants: RolePermissionsBody,
  ) => Promise<string | null>;
}) {
  const mounted = useClient();
  const [slug, setSlug] = useState(role?.slug ?? "");
  const [name, setName] = useState(role?.name ?? "");
  const [selected, setSelected] = useState<string[]>(role?.permission_ids ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionRow[]>();
    for (const row of permissions) {
      const list = map.get(row.controller) ?? [];
      list.push(row);
      map.set(row.controller, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const draft = (): RoleDraft => ({ slug, name, permissionIds: selected });
  const title =
    mode === "create" ? "Nuevo rol" : mode === "duplicate" ? "Duplicar rol" : name.trim() || "Editar rol";
  const kicker =
    mode === "create" ? "Alta" : mode === "duplicate" ? "Plantilla" : role?.locked ? "Bloqueado" : "Edición";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const gap = missingRoleField(draft());
    if (gap) {
      setError(gap);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (mode === "edit") {
        if (!role) return;
        const patch = patchRoleBody(draft(), { slug: role.slug, name: role.name });
        const grants = permissionsBody(draft());
        if (patch === null && sameIds(role.permission_ids, grants.permission_ids)) {
          onClose();
          return;
        }
        const detail = await onUpdate(role.id, patch, grants);
        if (detail) setError(detail);
        return;
      }
      const detail = await onCreate(createRoleBody(draft()));
      if (detail) setError(detail);
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  const panel = (
    <form onSubmit={onSubmit} className="flex min-h-full flex-col" noValidate>
      <div className="border-ink/14 flex items-start justify-between gap-4 border-b px-[26px] py-[22px]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-accent-gold font-mono text-[9.5px] tracking-[0.2em] uppercase">{kicker}</p>
          <p id="role-drawer-title" className="font-display text-[30px] leading-none">
            {title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`${buttonMotion} text-text-meta hover:text-ink px-2 py-1 text-[20px] leading-none`}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-[26px] py-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
              autoComplete="off"
              aria-label="Nombre"
            />
          </Field>
          <Field label="Slug">
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className={fieldClass}
              autoComplete="off"
              spellCheck={false}
              aria-label="Slug"
            />
          </Field>
        </div>

        <div className="flex flex-col gap-4">
          <p className={labelClass}>Matriz de permisos</p>
          {grouped.length === 0 ? (
            <p className="text-text-meta text-sm">No hay permisos en el catálogo.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {grouped.map(([controller, rows]) => (
                <div key={controller} className="border-ink/10 border-t pt-4">
                  <p className="text-ink mb-3 font-mono text-[11px] tracking-[0.08em] uppercase">
                    {controller}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rows.map((row) => {
                      const on = selected.includes(row.id);
                      const label = row.method ?? "flag";
                      return (
                        <button
                          key={row.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(row.id)}
                          className={`${buttonMotion} rounded-full border px-[13px] py-2 text-[11.5px] tracking-[0.06em] ${
                            on
                              ? "bg-ink text-canvas border-ink"
                              : "text-ink border-ink/20 bg-transparent"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error ? (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}
      </div>

      <div className="border-ink/14 mt-auto flex justify-end gap-3 border-t px-[26px] py-5">
        <button
          type="button"
          onClick={onClose}
          className={`${buttonMotion} text-text-meta hover:text-ink px-4 py-3 text-[11px] tracking-[0.14em] uppercase`}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`${buttonMotion} bg-ink text-canvas hover:bg-accent-gold disabled:opacity-60 px-[22px] py-3.5 text-[11px] tracking-[0.16em] uppercase`}
        >
          {mode === "edit" ? "Guardar" : "Crear rol"}
        </button>
      </div>
    </form>
  );

  return createPortal(
    <div className="fixed inset-0 z-[110] flex justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        className="bg-ink/40 absolute inset-0 cursor-pointer border-0"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-drawer-title"
        className="bg-canvas animate-slide-in motion-reduce:animate-none relative z-[1] flex h-full w-full max-w-[520px] flex-col shadow-[-18px_0_40px_rgba(20,16,14,0.12)]"
      >
        {panel}
      </aside>
    </div>,
    document.body,
  );
}
