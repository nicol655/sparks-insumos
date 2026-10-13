"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { RoleDrawer, type RoleDrawerMode } from "@/components/users/role-drawer";
import { endSession } from "@/lib/auth/end-session";
import { useSessionStore } from "@/lib/auth/session-store";
import type { PermissionRow, RoleStatistics } from "@/lib/roles/contract";
import {
  createRolesClient,
  isUnauthenticated,
  type RolesClient,
} from "@/lib/roles/client";
import {
  duplicateDraft,
  type RoleCreateBody,
  type RolePatchBody,
  type RolePermissionsBody,
} from "@/lib/roles/form";
import { SESSION_DETAIL } from "@/lib/users/labels";

const pointer = "cursor-pointer transition-colors duration-150";
const COLUMNS = "minmax(180px,2fr) 120px 110px 140px 150px 160px";

const CREATED_TOAST = "Rol creado.";
const UPDATED_TOAST = "Rol actualizado.";
const EMPTY_ROLES = "Todavía no hay roles.";

function duplicateAsRole(source: RoleStatistics): RoleStatistics {
  const copy = duplicateDraft(source);
  return {
    ...source,
    slug: copy.slug,
    name: copy.name,
    permission_ids: copy.permissionIds,
    locked: false,
  };
}

export function RolesPanel({
  client,
  onCount,
  creating,
  onCreatingChange,
}: {
  client?: RolesClient;
  onCount?: (count: number) => void;
  creating: boolean;
  onCreatingChange: (open: boolean) => void;
}) {
  const rolesApi = useMemo(() => client ?? createRolesClient("/api"), [client]);
  const router = useRouter();
  const replaceRef = useRef(router.replace);
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.hydrated);
  const [rows, setRows] = useState<RoleStatistics[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [drawer, setDrawer] = useState<{
    mode: RoleDrawerMode;
    role: RoleStatistics | null;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    replaceRef.current = router.replace;
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function refresh(currentToken: string) {
    const [stats, catalog] = await Promise.all([
      rolesApi.listStatistics(currentToken),
      rolesApi.listPermissions(currentToken),
    ]);
    if (isUnauthenticated(stats) || isUnauthenticated(catalog)) {
      endSession((path) => replaceRef.current(path));
      return false;
    }
    if (!stats.ok) {
      setError(stats.detail);
      setLoaded(true);
      return false;
    }
    if (!catalog.ok) {
      setError(catalog.detail);
      setLoaded(true);
      return false;
    }
    setRows(stats.roles);
    setPermissions(catalog.permissions);
    onCount?.(stats.roles.length);
    setError(null);
    setLoaded(true);
    return true;
  }

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    void (async () => {
      await refresh(token);
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
    // Load once per hydrated token; refresh() is stable enough for this panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token, rolesApi]);

  function closeDrawer() {
    onCreatingChange(false);
    setDrawer(null);
    openerRef.current?.focus();
  }

  const activeDrawer = creating ? { mode: "create" as const, role: null } : drawer;

  async function onCreate(body: RoleCreateBody): Promise<string | null> {
    const current = useSessionStore.getState().accessToken;
    if (!current) return SESSION_DETAIL;
    const result = await rolesApi.createRole(body, current);
    if (isUnauthenticated(result)) {
      endSession((path) => replaceRef.current(path));
      return null;
    }
    if (!result.ok) return result.detail;
    await refresh(current);
    setToast(CREATED_TOAST);
    closeDrawer();
    return null;
  }

  async function onUpdate(
    id: string,
    patch: RolePatchBody | null,
    grants: RolePermissionsBody,
  ): Promise<string | null> {
    const current = useSessionStore.getState().accessToken;
    if (!current) return SESSION_DETAIL;
    if (patch) {
      const patched = await rolesApi.updateRole(id, patch, current);
      if (isUnauthenticated(patched)) {
        endSession((path) => replaceRef.current(path));
        return null;
      }
      if (!patched.ok) return patched.detail;
    }
    const replaced = await rolesApi.replacePermissions(id, grants, current);
    if (isUnauthenticated(replaced)) {
      endSession((path) => replaceRef.current(path));
      return null;
    }
    if (!replaced.ok) return replaced.detail;
    await refresh(current);
    setToast(UPDATED_TOAST);
    closeDrawer();
    return null;
  }

  const sessionError = hydrated && !token ? SESSION_DETAIL : null;
  const showLoading = !hydrated || (token !== null && !loaded);

  return (
    <div className="flex flex-col gap-5">
      {sessionError ? (
        <p role="alert" className="text-danger text-sm">
          {sessionError}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      {showLoading ? <p className="text-text-meta text-sm">Cargando los roles…</p> : null}
      {!showLoading && !sessionError && !error ? (
        <div className="border-ink overflow-x-auto border-t">
          <div className="min-w-[860px]">
            <div
              className="text-text-meta grid gap-3.5 border-b border-ink/20 px-4 py-3 font-mono text-[9.5px] tracking-[0.14em] uppercase"
              style={{ gridTemplateColumns: COLUMNS }}
            >
              <span>Rol</span>
              <span>Usuarios</span>
              <span>Permisos</span>
              <span>Panel</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid items-center gap-3.5 border-b border-ink/10 px-4 py-[15px] text-[13.5px] text-ink"
                style={{ gridTemplateColumns: COLUMNS }}
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span>{row.name}</span>
                  <span className="text-text-meta truncate font-mono text-[11px]">{row.slug}</span>
                </span>
                <span className="font-mono text-[12px]">{row.users_count}</span>
                <span className="font-mono text-[12px]">{row.permissions_count}</span>
                <span>{row.has_backoffice_access ? "Sí" : "No"}</span>
                <span className="font-mono text-[10px] tracking-[0.08em] uppercase">
                  {row.locked ? "Protegido" : "Editable"}
                </span>
                <span className="flex flex-wrap gap-2">
                  {row.locked ? null : (
                    <button
                      type="button"
                      className={`${pointer} text-ink underline-offset-2 hover:underline`}
                      onClick={(event) => {
                        openerRef.current = event.currentTarget;
                        setDrawer({ mode: "edit", role: row });
                      }}
                    >
                      Editar
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${pointer} text-ink underline-offset-2 hover:underline`}
                    onClick={(event) => {
                      openerRef.current = event.currentTarget;
                      setDrawer({ mode: "duplicate", role: duplicateAsRole(row) });
                    }}
                  >
                    Duplicar
                  </button>
                </span>
              </div>
            ))}
            {rows.length === 0 ? (
              <p className="text-text-meta px-4 py-[50px] text-center font-display text-[22px] italic">
                {EMPTY_ROLES}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeDrawer ? (
        <RoleDrawer
          mode={activeDrawer.mode}
          role={activeDrawer.role}
          permissions={permissions}
          onClose={closeDrawer}
          onCreate={onCreate}
          onUpdate={onUpdate}
        />
      ) : null}

      {toast ? (
        <p
          role="status"
          className="bg-ink text-canvas animate-fade-up-toast motion-reduce:animate-none fixed bottom-[30px] left-1/2 z-[120] -translate-x-1/2 px-6 py-3.5 text-[11.5px] tracking-[0.14em] uppercase"
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}
