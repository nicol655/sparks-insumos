# 022 · Role management & admin access protection

- **Status:** implemented (2026-10-06)
- **Date:** 2026-10-06
- **Parents:** [020](../020-roles-permissions/spec.md) seeded RBAC,
  roles CRUD, and `GET /permissions`.
  [019](../019-usuarios-backoffice/spec.md) Usuarios screen with
  Clientes / Equipo tabs (Equipo empty; roles UI deferred).
  [011](../011-backoffice-cascaron/spec.md) panel shell.
  Constitution 14 / 17 and
  [ADR-0015](../../decisions/0015-diseno-backoffice-y-reglas-de-operacion.md)
  (artifact `NtzZJG94zfZrj3LpMvAtS9` as sole backoffice design source).
  Opaque permission denial
  ([ADR-0027](../../decisions/0027-rbac-catalogo-y-denegacion-opaca.md)).
  No invented panel data
  ([ADR-0026](../../decisions/0026-usuarios-del-panel-sin-datos-inventados.md)).

## Problem

Operators with `roles` grants can PATCH, soft-DELETE, or replace
permissions on the seeded `admin` role, which can lock the platform out
of itself. There is no `is_super_admin` flag for future privileged
checks. The panel Usuarios section has no Roles tab, no roles table, and
no permissions matrix — 020 left that UI out of scope.

## Objective

Harden the seeded `admin` role against mutation, add a read-only
`is_super_admin` flag (true only for the bootstrap user), expose a
roles statistics endpoint for the panel table, and ship the Roles tab
inside Usuarios (drawer create / edit / duplicate + permissions matrix)
matching the backoffice artifact.

## Decisions closed (2026-10-06)

| # | Decision |
|---|----------|
| Q1 | Identify the locked role by **slug `admin`** (seeded row). PATCH, DELETE, and `PUT …/permissions` on that role return **403** `forbidden` (resource lock, not an RBAC miss — see ADR-0030). |
| Q2 | `users.is_super_admin` boolean, NOT NULL, default `false`. Migration + bootstrap set `true` only for the bootstrap admin email. Not writable via register / user create / user patch. Exposed read-only on `UserPublic`. Not used for authorization in this slice. |
| Q3 | New `GET /roles/statistics` (FastAPI path without requiring a trailing slash; redirects OK). Requires `roles` + `list`. Returns every non-deleted role plus aggregates needed by the Roles table. Declared **before** `GET /roles/{role_id}` so `"statistics"` is not parsed as a UUID. |
| Q4 | Usuarios gains a third tab **Roles** beside Clientes and Equipo. Equipo stays empty (019). Roles table + matrix + drawer follow the artifact. |
| Q5 | Create / duplicate submit via `POST /roles` (optional `permission_ids` on the body so one successful create can include grants). Edit: `PATCH /roles/{id}` then `PUT /roles/{id}/permissions` when grants change. Drawer closes and table refreshes only after the submit chain succeeds. |
| Q6 | Edit (and delete controls, if any) are hidden/disabled for the locked `admin` role. **Duplicate** of `admin` remains allowed (POST creates a new role; it does not mutate `admin`). |

## Scope

### In

1. API guard: block PATCH / DELETE / PUT-permissions on slug `admin` → 403.
2. Migration: `users.is_super_admin`; backfill + bootstrap seed; `UserPublic` + Zod sync.
3. `GET /roles/statistics` with role list + aggregates for the panel table.
4. Optional `permission_ids` on `RoleCreate` (same replace semantics and
   `change_backoffice_access` gate as `PUT …/permissions`).
5. Backoffice: Roles tab, statistics-backed table, permissions matrix
   (`GET /permissions`), role drawer (create / edit / duplicate),
   same-origin proxies, client, tests.
6. Docs: architecture, glossary, progress; ADR-0030.

### Out

- Using `is_super_admin` to gate any endpoint (future).
- Inviting Equipo members, filling Equipo with Martina / Diego / Carla.
- Inventing permission controllers at runtime (ADR-0027).
- Hard-delete of roles; changing soft-delete rules.
- Storefront (`web/`) UI.
- Weakening opaque 401 for ordinary permission misses.

## Concepts

| Term | Meaning |
|------|---------|
| **Locked admin role** | Seeded role with slug `admin`. Immutable via roles write APIs in this slice. |
| **`is_super_admin`** | User flag. Only the bootstrap account is `true`. Reserved for later privileged checks. |
| **Role statistics** | Per-role payload: identity + `permission_ids` + counts / flags the Roles table needs without N+1 client calls. |
| **Duplicate** | Open the drawer prefilled from an existing role; submit creates a **new** role (`POST`), never patches the source. |

## Stories

| # | Priority | Story |
|---|----------|--------|
| US-1 | P0 | As the system, I reject any attempt to alter or soft-delete the `admin` role with 403 |
| US-2 | P0 | As the system, every user has `is_super_admin`; only the bootstrap user is `true` |
| US-3 | P0 | As a caller with `roles` list, I get statistics for all non-deleted roles in one call |
| US-4 | P0 | As a staff member, I manage roles from the Usuarios → Roles tab (table, matrix, create / edit / duplicate drawers) per the artifact |

## Acceptance criteria

1. **Admin lock.** `PATCH /roles/{admin_id}`, `DELETE /roles/{admin_id}`, and
   `PUT /roles/{admin_id}/permissions` return **403** with an explicit
   forbidden-style body (not the opaque 401 of ADR-0027). Other roles
   keep existing 020 behavior (including 409 when delete still has users).
2. **`is_super_admin`.** Column exists, default `false` for new and
   existing rows; bootstrap / migration sets `true` only for
   `admin@sparksinsumos.com` (bootstrap email). Create/register/patch
   cannot set the flag. `UserPublic` (and backoffice Zod) include it
   read-only.
3. **Statistics.** `GET /roles/statistics` returns the full non-deleted
   role list plus aggregates sufficient to render the Roles table
   (at least: id, slug, name, timestamps, `permission_ids`,
   `users_count`, `permissions_count`, `locked`, `has_backoffice_access`).
   Ordered newest-first (same as `GET /roles`). Permission: `roles` + `list`.
4. **Panel layout.** Usuarios shows a Roles tab. Table loads from
   statistics via same-origin proxy. Permissions matrix uses
   `GET /permissions`. Visuals and interactions match the artifact
   (constitution 17 / ADR-0015). No invented columns: missing business
   fields stay dash/empty (ADR-0026).
5. **Drawer actions.** Nuevo rol → empty drawer → successful create closes
   and refreshes. Editar → prefilled → successful update closes and
   refreshes; control absent/disabled for `locked` admin. Duplicar →
   prefilled template → POST new role → close and refresh. Drawer stays
   open with an error if any step of the submit chain fails.
6. **RBAC / audit unchanged** for allowed writes: `require_permission`,
   `change_backoffice_access` when toggling panel access, `@audited` on
   role writes.

## Open questions

None.

## Approval

Approved with the story AC on 2026-10-06. Plan: [`plan.md`](./plan.md).
Tasks: [`tasks.md`](./tasks.md). Next: `/implement` (T397).
