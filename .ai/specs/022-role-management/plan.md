# Plan · 022 Role management & admin access protection

- **Status:** implemented (2026-10-06)
- **Spec:** [`spec.md`](./spec.md) (approved)
- **ADRs:** [0030](../../decisions/0030-admin-role-locked-and-super-admin.md).
  Reuses RBAC catalog + opaque miss
  ([ADR-0027](../../decisions/0027-rbac-catalogo-y-denegacion-opaca.md)),
  soft delete
  ([ADR-0028](../../decisions/0028-soft-delete-deleted-at.md)),
  panel design source
  ([ADR-0015](../../decisions/0015-diseno-backoffice-y-reglas-de-operacion.md)),
  no invented panel data
  ([ADR-0026](../../decisions/0026-usuarios-del-panel-sin-datos-inventados.md)),
  sessionStorage bearer
  ([ADR-0014](../../decisions/0014-sesion-backoffice-session-storage.md)),
  401 ends panel session
  ([ADR-0020](../../decisions/0020-catalogo-401-cierra-sesion.md)),
  audit opt-in
  ([ADR-0017](../../decisions/0017-auditoria-opt-in-y-contexto.md)).

## 1 · Approach

Three layers, in this order.

1. **API harden + data.** Alembic revision adds `users.is_super_admin`,
   backfills the bootstrap email, updates bootstrap insert. Shared helper
   rejects writes to slug `admin` with 403. Extend `RoleCreate` with
   optional `permission_ids`. Add `GET /roles/statistics` registered
   **above** `/{role_id}`. Sync `UserPublic` / Zod.
2. **Panel transport.** Same-origin routes under `/api/roles` and
   `/api/permissions` forward the bearer (catalog / users pattern).
   Typed clients + Zod contracts.
3. **Usuarios UI.** Third tab Roles: table from statistics, matrix from
   permissions catalog, drawer for create / edit / duplicate. Match
   artifact layout/hover/cursor/animation; wait for successful API
   before close + refresh.

No new npm/Python dependencies. `web/` untouched.

## 2 · Files

| File | Change |
|------|--------|
| `api/alembic/versions/0007_is_super_admin.py` | Column + backfill bootstrap email |
| `api/app/models/user.py` | `is_super_admin: Mapped[bool]` |
| `api/app/bootstrap.py` | Insert `is_super_admin=true` when column exists |
| `api/app/schemas/auth.py` | `UserPublic.is_super_admin`; `to_user_public` |
| `api/app/schemas/rbac.py` | `RoleCreate.permission_ids`; `RoleStatisticsPublic` |
| `api/app/api/routes/roles.py` | Admin lock helper; statistics route; create with grants |
| `api/tests/e2e/test_rbac.py` (and/or `test_roles_admin_lock.py`) | 403 on admin writes; statistics shape |
| `api/tests/unit/test_rbac_tables.py` / bootstrap tests | `is_super_admin` seed |
| `api/tests/e2e/test_users_admin.py` / auth fixtures | Zod/public field present; cannot patch flag |
| `backoffice/src/lib/users/contract.ts` | `is_super_admin` on `userSchema` |
| `backoffice/src/lib/roles/contract.ts` | Role / statistics / permission Zod |
| `backoffice/src/lib/roles/client.ts` | listStatistics, create, patch, putPermissions, listPermissions |
| `backoffice/src/lib/roles/proxy.ts` | Forward helper (mirror users) |
| `backoffice/src/lib/roles/form.ts` | Client-side required fields before submit |
| `backoffice/src/app/api/roles/route.ts` | GET statistics proxy; POST create |
| `backoffice/src/app/api/roles/[id]/route.ts` | PATCH / DELETE |
| `backoffice/src/app/api/roles/[id]/permissions/route.ts` | PUT permissions |
| `backoffice/src/app/api/permissions/route.ts` | GET catalog |
| `backoffice/src/components/users/users-screen.tsx` | Roles tab; wire table / drawer |
| `backoffice/src/components/users/roles-panel.tsx` (or similar) | Table + matrix + actions |
| `backoffice/src/components/users/role-drawer.tsx` | Create / edit / duplicate |
| Colocated `__tests__/*` | AC-4…AC-5; contract / proxy / form |
| `.ai/architecture.md` / `glossary.md` / `progress.md` | Panel RBAC UI + lock + flag |

## 3 · Data model

```text
users
  + is_super_admin  boolean not null default false
```

Migration:

1. Add column with `server_default=false`, then backfill
   `UPDATE users SET is_super_admin = true WHERE lower(email) = 'admin@sparksinsumos.com'`.
2. Drop server default if the codebase prefers app-level default only
   (match existing boolean columns pattern).

Bootstrap `insert_bootstrap_admin`: when the column exists, insert
`is_super_admin = true`. Never set the flag from HTTP bodies
(`UserCreate` / `UserAdminPatch` / register omit it; `extra = forbid`).

Locked role identity: constant slug `"admin"` (not `is_super_admin`).

## 4 · HTTP surface

### Admin lock (ADR-0030)

After `_get_role`, if `role.slug == "admin"`:

| Method | Path | Result |
|--------|------|--------|
| PATCH | `/roles/{id}` | 403 `forbidden` |
| DELETE | `/roles/{id}` | 403 `forbidden` |
| PUT | `/roles/{id}/permissions` | 403 `forbidden` |

Spanish detail consistent with other domain errors (e.g. «No se puede
modificar el rol administrador.»). Distinct from opaque 401 permission
miss and from 403 `password_change_required`.

GET list / retrieve / statistics for `admin` remain allowed.

### Role create with grants

`RoleCreate`:

```text
slug, name, permission_ids?: uuid[]   # default []
```

On POST: create role, then attach permissions with the **same** rules as
`put_role_permissions` (unknown ids → 422; toggling `backoffice_access`
requires caller `change_backoffice_access`). One transaction preferred
(rollback role if grants fail). Audit create once with final public
payload including `permission_ids`.

### Statistics

| Method | Path | Permission | Behavior |
|--------|------|------------|----------|
| GET | `/roles/statistics` | `roles` + `list` | Non-deleted roles, newest first |

Response item (`RoleStatisticsPublic`):

| Field | Source |
|-------|--------|
| `id`, `slug`, `name`, `created_at`, `updated_at` | `roles` |
| `permission_ids` | current grants |
| `permissions_count` | `len(permission_ids)` |
| `users_count` | count `users` with this `role_id` and `deleted_at IS NULL` |
| `locked` | `slug == "admin"` |
| `has_backoffice_access` | grant includes method-less `backoffice_access` |

Implement with one roles query (selectin permissions) plus one grouped
user count query (or correlated subquery). Limit optional (default 50,
max 100) for parity with `GET /roles`.

Route order in `roles.py`: `""` list → `"statistics"` → `"/{role_id}"` →
nested permissions.

## 5 · Backoffice UI

### Tabs

`UsersScreen` tab state: `"clients" | "team" | "roles"`. Third control
label **Roles**, count = statistics length (or `0` while loading).
Equipo stays empty copy from 019. «Nuevo rol» appears in the heading
action when the Roles tab is active (artifact button).

### Table + matrix

- Load `GET /api/roles/statistics` when the Roles tab is selected (or on
  mount if that matches the artifact — prefer lazy on tab select to
  avoid extra calls on Clientes).
- Load `GET /api/permissions` once for the matrix catalog.
- Columns / density / typography / hover from the artifact. If the
  artifact shows a field the API does not return, render `—`
  (ADR-0026). Do not invent Equipo members or permission controllers.
- Row actions: Editar (hidden when `locked`), Duplicar, and any delete
  control hidden when `locked` (API would 403 anyway).

### Drawer

Modes: `create` | `edit` | `duplicate`.

| Mode | Prefill | Submit |
|------|---------|--------|
| create | empty name/slug, no checks | `POST /roles` with `permission_ids` |
| edit | role fields + checks | `PATCH` if name/slug changed; always `PUT` permissions if set changed (or both). Await all; then close |
| duplicate | copy name/slug/permissions as template (operator must change slug before success; client may suffix `-copia` as a starting value) | `POST /roles` with new slug/name + `permission_ids` |

Shared rules with 019 drawers: focus return to opener, stay open on
error, toast on success, `endSession` on 401. Close **only** after the
full submit chain returns ok, then re-fetch statistics (and keep
permissions catalog).

Matrix: group catalog by `controller`; checkbox per method (and
method-less rows). Checking/unchecking only toggles ids already in
`GET /permissions` — never invent controllers.

### Proxy

Mirror `lib/users/proxy.ts`: require bearer; forward status/JSON;
invalid UUID path → 404 without calling API.

## 6 · Docs on implement

- `architecture.md` backoffice bullet: Roles tab, statistics, admin lock,
  `is_super_admin` read-only.
- `glossary.md`: locked admin role; `is_super_admin`; update Equipo line
  (roles UI no longer “out of scope”).
- Constitution 14 unchanged (roles set still admin/sales/customer).
- No constitution change for 403 lock (ADR-0030 documents the exception
  to opaque denial).

## 7 · Test strategy (proves AC)

| AC | Proof |
|----|--------|
| 1 | e2e: admin token PATCH/DELETE/PUT-permissions on admin role → 403; same ops on a custom role → 2xx / existing errors |
| 2 | unit/migration: column default false; bootstrap email true; others false; POST/PATCH user with `is_super_admin` → 422; `UserPublic` includes field |
| 3 | e2e: GET statistics includes seeded roles with `users_count` / `locked` / `permission_ids`; sales without roles list → opaque 401 |
| 4 | Vitest: Roles tab renders; table from mocked statistics; matrix from mocked permissions; no edit button on `locked` |
| 5 | Vitest: create/edit/duplicate drawers call client methods; do not close on failure; refresh after success |
| 6 | Existing rbac e2e still green; create with `backoffice_access` without `change_backoffice_access` → opaque 401 |

API: pytest in Docker. Backoffice: `npm run verify` via compose `--no-deps`.
Ruff clean.

## 8 · Risks

| Risk | Mitigation |
|------|------------|
| Artifact fetch unavailable in agents | Implementer opens `NtzZJG94zfZrj3LpMvAtS9` and matches Roles section visually; plan defines data, not pixel guesswork |
| `GET /roles/{id}` catches `"statistics"` | Declare statistics route first; add a regression test |
| Create with grants half-applied | Single transaction on POST |
| Operators confuse 403 lock with password gate | Distinct `code: forbidden` + Spanish role-specific detail; UI hides edit |
| Exposing `is_super_admin` invites UI misuse | Read-only; no panel control in this slice; ADR-0030 |
| Duplicate of admin copies full matrix including panel flags | Allowed by AC; still gated by `change_backoffice_access` when attaching `backoffice_access` |

## 9 · Out of scope (reminders)

- Authorizing any route with `is_super_admin`.
- Equipo invitation / sample operators.
- Storefront changes.
- Changing opaque 401 for missing permissions.

## Next

Tasks: [`tasks.md`](./tasks.md) (T397–T408). Next: `/implement`
starting at T397.
