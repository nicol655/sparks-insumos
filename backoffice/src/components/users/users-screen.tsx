"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { RolesPanel } from "@/components/users/roles-panel";
import { UserDrawer } from "@/components/users/user-drawer";
import { endSession } from "@/lib/auth/end-session";
import { useSessionStore } from "@/lib/auth/session-store";
import type { Account } from "@/lib/users/contract";
import { createUsersClient, isUnauthenticated, type UsersClient } from "@/lib/users/client";
import type { UserCreateBody, UserPatchBody } from "@/lib/users/form";
import {
  CREATED_TOAST,
  EMPTY_CLIENTS,
  EMPTY_TEAM,
  FIFTY_NOTE,
  FILTER_EMPTY,
  SESSION_DETAIL,
  UPDATED_TOAST,
  clientsKicker,
  clientsSummary,
  formatAlta,
  initials,
} from "@/lib/users/labels";

const CHIPS = [
  { id: "all", label: "Todos" },
  { id: "club", label: "Sparks Club" },
  { id: "guest", label: "Invitados" },
  { id: "blocked", label: "Bloqueados" },
] as const;

type ChipId = (typeof CHIPS)[number]["id"];

const controlClass = "border-ink/22 text-ink bg-transparent px-3.5 py-[11px] text-[13.5px] outline-none";
const pointer = "cursor-pointer transition-colors duration-150";

const COLUMNS = "minmax(220px,2fr) 170px 110px 80px 130px 110px 110px";

function matches(account: Account, query: string, chip: ChipId): boolean {
  if (chip === "club" || chip === "guest") return false;
  if (chip === "blocked" && account.active) return false;
  const needle = query.trim().toLocaleLowerCase("es");
  if (!needle) return true;
  const haystack = `${account.first_name} ${account.last_name} ${account.email} ${account.phone}`.toLocaleLowerCase(
    "es",
  );
  return haystack.includes(needle);
}

function StatusPill({ active }: { active: boolean }) {
  const tone = active
    ? "border-[rgba(76,164,85,0.45)] bg-[rgba(76,164,85,0.1)] text-[#2F7A38]"
    : "border-[rgba(180,68,58,0.4)] bg-[rgba(180,68,58,0.07)] text-[#B4443A]";
  const dot = active ? "bg-[#4CA455]" : "bg-[#B4443A]";
  return (
    <span
      className={`inline-flex items-center gap-[7px] justify-self-start rounded-full border px-2.5 py-1 font-mono text-[9.5px] tracking-[0.1em] whitespace-nowrap uppercase ${tone}`}
    >
      <span className={`size-1.5 rounded-full ${dot}`} />
      {active ? "Activa" : "Bloqueada"}
    </span>
  );
}

export function UsersScreen({ client }: { client?: UsersClient }) {
  const users = useMemo(() => client ?? createUsersClient("/api"), [client]);
  const router = useRouter();
  const replaceRef = useRef(router.replace);
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.hydrated);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"clients" | "team" | "roles">("clients");
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<ChipId>("all");
  const [creating, setCreating] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const [rolesCount, setRolesCount] = useState(0);
  const [editing, setEditing] = useState<Account | null>(null);
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

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    void (async () => {
      const result = await users.listUsers(token);
      if (cancelled) return;
      if (isUnauthenticated(result)) {
        endSession((path) => replaceRef.current(path));
        return;
      }
      if (!result.ok) {
        setError(result.detail);
        setLoaded(true);
        return;
      }
      setAccounts(result.users);
      setError(null);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token, users]);

  const sessionError = hydrated && !token ? SESSION_DETAIL : null;
  const showLoading = !hydrated || (token !== null && !loaded);
  const visible = accounts.filter((account) => matches(account, query, chip));
  const untouched = accounts.length === 0 && chip === "all" && query.trim() === "";

  function closeDrawer() {
    setCreating(false);
    setEditing(null);
    openerRef.current?.focus();
  }

  async function onCreate(body: UserCreateBody): Promise<string | null> {
    const current = useSessionStore.getState().accessToken;
    if (!current) return SESSION_DETAIL;
    const result = await users.createUser(body, current);
    if (isUnauthenticated(result)) {
      endSession((path) => replaceRef.current(path));
      return null;
    }
    if (!result.ok) return result.detail;
    setAccounts((list) => [result.user, ...list]);
    setToast(CREATED_TOAST);
    closeDrawer();
    return null;
  }

  async function onUpdate(id: string, body: UserPatchBody): Promise<string | null> {
    const current = useSessionStore.getState().accessToken;
    if (!current) return SESSION_DETAIL;
    const result = await users.updateUser(id, body, current);
    if (isUnauthenticated(result)) {
      endSession((path) => replaceRef.current(path));
      return null;
    }
    if (!result.ok) return result.detail;
    setAccounts((list) => list.map((account) => (account.id === id ? result.user : account)));
    setToast(UPDATED_TOAST);
    closeDrawer();
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        kicker={clientsKicker(accounts.length)}
        title="Usuarios"
        action={
          tab === "clients" ? (
            <button
              type="button"
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setEditing(null);
                setCreating(true);
              }}
              className={`${pointer} bg-ink text-canvas hover:bg-accent-gold px-[22px] py-3.5 text-[11px] tracking-[0.16em] uppercase`}
            >
              Nuevo cliente
            </button>
          ) : tab === "roles" ? (
            <button
              type="button"
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setCreatingRole(true);
              }}
              className={`${pointer} bg-ink text-canvas hover:bg-accent-gold px-[22px] py-3.5 text-[11px] tracking-[0.16em] uppercase`}
            >
              Nuevo rol
            </button>
          ) : null
        }
      />
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
      {showLoading ? <p className="text-text-meta text-sm">Cargando las cuentas…</p> : null}
      {!showLoading && !sessionError && !error ? (
        <>
          <div className="border-ink/14 flex gap-[26px] border-b">
            {(
              [
                ["clients", "Clientes", String(accounts.length)],
                ["team", "Equipo", "0"],
                ["roles", "Roles", String(rolesCount)],
              ] as const
            ).map(([id, label, count]) => {
              const on = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTab(id)}
                  className={`${pointer} -mb-px flex gap-2 border-b pt-0 pb-3 text-[11px] tracking-[0.14em] uppercase ${
                    on ? "border-ink text-ink" : "text-text-meta border-transparent"
                  }`}
                >
                  {label}
                  <span className="font-mono opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          {tab === "team" ? (
            <p className="text-text-meta px-4 py-[50px] text-center font-display text-[22px] italic">{EMPTY_TEAM}</p>
          ) : tab === "roles" ? (
            <RolesPanel
              creating={creatingRole}
              onCreatingChange={setCreatingRole}
              onCount={setRolesCount}
            />
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nombre, email o teléfono"
                  className={`${controlClass} max-w-[380px] min-w-[240px] flex-1 border`}
                />
                <div className="flex flex-wrap gap-[7px]">
                  {CHIPS.map((item) => {
                    const on = chip === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setChip(item.id)}
                        className={`${pointer} rounded-full border px-[13px] py-2 text-[11.5px] tracking-[0.06em] whitespace-nowrap ${
                          on ? "bg-ink text-canvas border-ink" : "text-ink border-ink/20 bg-transparent"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-text-meta ml-auto font-mono text-[10.5px] tracking-[0.08em]">
                  {clientsSummary(visible.length)}
                </span>
              </div>
              <div className="border-ink overflow-x-auto border-t">
                <div className="min-w-[900px]">
                  <div
                    className="text-text-meta grid gap-3.5 border-b border-ink/20 px-4 py-3 font-mono text-[9.5px] tracking-[0.14em] uppercase"
                    style={{ gridTemplateColumns: COLUMNS }}
                  >
                    <span>Cliente</span>
                    <span>Teléfono</span>
                    <span>Nivel</span>
                    <span>Pedidos</span>
                    <span>Total gastado</span>
                    <span>Alta</span>
                    <span>Estado</span>
                  </div>
                  {visible.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={(event) => {
                        openerRef.current = event.currentTarget;
                        setCreating(false);
                        setEditing(account);
                      }}
                      className={`${pointer} hover:bg-[rgba(20,16,14,0.03)] grid w-full items-center gap-3.5 border-b border-ink/10 bg-transparent px-4 py-[15px] text-left text-[13.5px] text-ink`}
                      style={{ gridTemplateColumns: COLUMNS }}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="border-ink/20 flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]">
                          {initials(account.first_name, account.last_name)}
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span>
                            {account.first_name} {account.last_name}
                          </span>
                          <span className="text-text-meta truncate text-[12px] font-light">{account.email}</span>
                        </span>
                      </span>
                      <span className="text-text-muted font-mono text-[11px]">{account.phone}</span>
                      <span>—</span>
                      <span className="font-mono text-[12px]">—</span>
                      <span>—</span>
                      <span className="text-text-muted font-mono text-[11px]">{formatAlta(account.created_at)}</span>
                      <StatusPill active={account.active} />
                    </button>
                  ))}
                  {visible.length === 0 ? (
                    <p className="text-text-meta px-4 py-[50px] text-center font-display text-[22px] italic">
                      {untouched ? EMPTY_CLIENTS : FILTER_EMPTY}
                    </p>
                  ) : null}
                </div>
              </div>
              {accounts.length === 50 ? <p className="text-text-meta text-sm">{FIFTY_NOTE}</p> : null}
            </div>
          )}
        </>
      ) : null}
      {creating || editing ? (
        <UserDrawer account={editing} onClose={closeDrawer} onCreate={onCreate} onUpdate={onUpdate} />
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
