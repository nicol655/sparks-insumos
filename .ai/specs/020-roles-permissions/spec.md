# 020 · Roles and permissions

- **Status:** implemented (2026-10-02)
- **Date:** 2026-10-02
- **Parents:** [007](../007-api-autenticacion/spec.md) accounts have no
  role. [010](../010-backoffice/spec.md) lets any successful login into the
  panel. [019](../019-usuarios-backoffice/spec.md) lists/edits accounts and
  leaves Equipo empty. This feature **replaces** constitution 14’s
  Administration / Logistics / Content with `admin`, `sales`, and
  `customer` (update `constitution.md` and `business-model.md` on
  implement).
- **Source matrix:** spreadsheet attached 2026-10-02 (`admin`, `sales`,
  `customer` × controllers × methods).

## Problem

Every account that already changed its password can call authenticated
catalog and users routes and can open the backoffice. There is no role,
no permission row, and no check that denies an action for the current
user. DELETE on catalog resources hard-removes rows. Soft availability
and RBAC are both missing.

## Objective

Introduce an **API-only** RBAC slice: models, migrations, seed of the
attached matrix, role endpoints, a read of the permission catalog,
check/uncheck of seeded methods on roles, one role per user, soft
delete via `deleted_at`, and a decorator that denies actions the
current user’s role does not allow. Storefront login stays open to
every non-deleted, active account under the existing password-change
rules. Backoffice access is gated by `backoffice_access` without
explaining the denial. Panel UI is **out of scope** (later; it will
call `permissions` to list controllers and methods).

## Decisions closed (2026-10-02)

| # | Decision |
|---|----------|
| Q1 | Replace constitution 14 with `admin` / `sales` / `customer`. Future panel lists permission names and methods via the `permissions` API. |
| Q2 | **Backend only** this slice. No backoffice UI. |
| Q3 | `POST /auth/register` → role `customer`. Migration assigns `customer` to existing users. Seed user `admin@sparksinsumos.com` → role `admin`. Every user always has exactly one role. |
| Q4 | Soft delete: add `deleted_at` to domain models. HTTP `DELETE` sets `deleted_at` to the request time. List/retrieve (and other reads) default-filter `deleted_at IS NULL`. Soft-deleted users are unavailable (cannot log in). |
| Q5 | Anonymous public `GET /products` and `GET /products/{id}` stay as in 017. Customer product list/retrieve applies when a bearer is present. |
| Q7 | Same `POST /auth/login` for storefront and panel. Do **not** tell the user why access was refused. The panel keeps the existing `/unauthorized` experience (no permission-specific copy). |
| Q6 | Permission **controllers/endpoints** are created only by **developer migrations**. Operators never create a new controller. They only check/uncheck **methods** (and method-less flags) on that fixed catalog when editing a role. `GET /permissions` lists the catalog for a future panel. |

## Scope

### In

1. Persist **roles**, **permissions**, role↔permission links, and
   **exactly one role per user** (`role_id` on `users`, required after
   migration).
2. Seed roles `admin`, `sales`, `customer` and the permission matrix
   below. Permissions and roles exist **before** user assignment.
3. Authenticated API for roles and for **listing** the permission
   catalog. The permissions list returns each controller and its
   methods (for a future backoffice). Operators attach/detach methods
   on a role; they do **not** create controllers. New controllers are
   added only by migrations written by developers.
4. Assign/change a user’s role only to an existing, non-deleted role.
5. Decorator/dependency on protected endpoints that **denies** when the
   current user’s role lacks the required controller + method (or
   method-less permission), or has an explicit deny.
6. Method-less `backoffice_access` and `change_backoffice_access` as
   specified below. Login credentials endpoint unchanged; denials for
   missing panel access do not explain the reason.
7. Soft delete: `deleted_at` on domain models used by these controllers
   (`users`, `roles`, `permissions`, `products`, `product_categories`,
   `tags`). `DELETE` sets the timestamp; reads default to
   `deleted_at IS NULL`. Soft-deleted users fail login (unavailable).
   `active = false` remains the explicit block from 007/019.
8. Wire the decorator onto existing protected routes for the matrix
   controllers. Add `DELETE /users/{id}` (soft) for callers with
   `users` + `delete`.
9. Update constitution 14 and `business-model.md` team roles to match
   this matrix.
10. API tests (unit / e2e) for seed, denial, soft delete filters,
    defaults, and method-less permissions.

### Out

- Backoffice UI (Equipo, role picker, permissions matrix screen,
  login-gate copy). Later slice; panel will call `permissions` then.
- Changing `web/` storefront UI (register/login flows keep working via
  API defaults).
- Coupons, orders, content, settings controllers not in the matrix.
- Inventing Logistics / Content permissions.
- Filling Equipo with Martina / Diego / Carla.
- Hard row delete (physical `DELETE FROM`).

## Concepts

| Term | Meaning |
|------|---------|
| **Role** | Named set of permissions. Creatable on demand via API (`roles` create). Each user has **exactly one** role. |
| **Permission** | Authorization unit: usually `controller` + `method`. Method-less: `backoffice_access`, `change_backoffice_access`. |
| **Controller** | Logical resource: `users`, `roles`, `permissions`, `me`, `products`, `product-categories`, `tags`, plus the two method-less names. |
| **Method** | `create` \| `edit` \| `delete` \| `retrieve` \| `list`, or absent. |
| **Missing link** | No permission rows for a controller on a role → no actions on that controller (e.g. `sales` vs `roles`). |
| **Explicit 0** | Method denied even if sibling methods on that controller are allowed (e.g. `sales` × `users` × `delete`). |
| **Soft delete** | `deleted_at` set; row kept. Default queries exclude it. Affects availability (not listed, not loginable for users). |

### Method ↔ HTTP (intent)

| Method | Typical HTTP |
|--------|----------------|
| `create` | `POST` collection |
| `edit` | `PATCH` (or replace) on one resource |
| `delete` | `DELETE` → set `deleted_at` |
| `retrieve` | `GET` by id |
| `list` | `GET` collection |

## Seed matrix (source of truth for v1)

Values: `1` = allowed, `0` = denied, blank methods = method-less
(presence on the role = allowed).

### `admin`

| Controller | create | edit | delete | retrieve | list |
|------------|--------|------|--------|----------|------|
| users | 1 | 1 | 1 | 1 | 1 |
| roles | 1 | 1 | 1 | 1 | 1 |
| permissions | 1 | 1 | 1 | 1 | 1 |
| me | 1 | 1 | 1 | 1 | 1 |
| products | 1 | 1 | 1 | 1 | 1 |
| product-categories | 1 | 1 | 1 | 1 | 1 |
| tags | 1 | 1 | 1 | 1 | 1 |
| backoffice_access | — | — | — | — | — |
| change_backoffice_access | — | — | — | — | — |

### `sales`

| Controller | create | edit | delete | retrieve | list |
|------------|--------|------|--------|----------|------|
| products | 1 | 1 | 1 | 1 | 1 |
| product-categories | 1 | 1 | 1 | 1 | 1 |
| tags | 1 | 1 | 1 | 1 | 1 |
| me | 1 | 1 | 1 | 1 | 1 |
| users | 1 | 1 | **0** | 1 | 1 |
| backoffice_access | — | — | — | — | — |

No `roles` / `permissions` / `change_backoffice_access` → no access.

### `customer`

| Controller | create | edit | delete | retrieve | list |
|------------|--------|------|--------|----------|------|
| products | 0 | 0 | 0 | 1 | 1 |
| me | 1 | 1 | 1 | 1 | 1 |

No backoffice permissions → panel treats the session as unauthorized
(without explaining why).

## Special permissions

1. **`backoffice_access`** (method-less)  
   Required for the panel to accept the session. Same
   `POST /auth/login` as the storefront. Valid credentials still get a
   normal login response so `web/` works. The panel (later) sends anyone
   without this permission to `/unauthorized` with **no** reason text.
   API denials for missing access also omit a permission-specific
   explanation.

2. **`change_backoffice_access`** (method-less)  
   Required to grant or revoke `backoffice_access` on roles. A caller
   who can edit roles but lacks this permission cannot attach or remove
   `backoffice_access`.

## Soft delete and availability

- Domain models in this slice gain nullable `deleted_at`
  (timestamptz).
- `DELETE` handlers set `deleted_at = now` (and update `updated_at`
  where it exists). They do **not** remove the row.
- List, retrieve, and other default reads filter `deleted_at IS NULL`.
- Soft-deleted **users** cannot authenticate (unavailable), same idea
  as blocked for access, distinct from `active = false` (operator
  block without delete).
- Existing catalog `DELETE` routes that hard-delete today switch to soft
  delete. Object storage cleanup for product photos on soft delete is a
  `/plan` trade-off (prefer: keep objects until a later purge).
- `DELETE /me` sets `deleted_at` (and keeps session revocation behavior
  from 007).

## Stories

| # | Priority | Story |
|---|----------|--------|
| US-1 | P0 | As the system, I seed `admin`, `sales`, and `customer` with the matrix; existing users become `customer`; seed admin becomes `admin` |
| US-2 | P0 | As a caller with the right role permissions, I create roles on demand and check/uncheck methods from the seeded permission catalog |
| US-3 | P0 | As an authenticated caller, I am denied without a permission-specific explanation when my role lacks the required permission |
| US-4 | P0 | As a storefront user, I register as `customer` and can use `web/` login when active, not deleted, and password-change rules pass |
| US-5 | P0 | As a caller with `change_backoffice_access`, I can grant `backoffice_access` to other roles; without it I cannot |
| US-6 | P0 | As a caller with `delete` on a resource, `DELETE` soft-deletes it; lists no longer return it |

## Acceptance criteria

1. After migration/seed: roles and matrix exist; every user has exactly
   one role; register → `customer`; existing users → `customer`; seed
   admin → `admin`. Assigning a missing/deleted role is rejected.
2. Permissions are `(controller, method)` or method-less
   `(controller)`. No link to a controller → no methods on it. Explicit
   `0` denies that method.
3. `sales` cannot call `roles` or `permissions` routes and cannot soft-
   delete users. `customer` authenticated product access is list +
   retrieve only. Anonymous product GET stays public.
4. Protected endpoints use a decorator/dependency that denies when the
   permission is missing or `0`. The client is **not** told which
   permission failed (unauthorized-style / no permission detail).
5. `POST /auth/login` stays one endpoint. Soft-deleted or inactive users
   cannot log in. `must_change_password` rules from 007 unchanged.
   Lack of `backoffice_access` is enforceable for panel use without a
   custom reason (panel `/unauthorized` later; API omits detail).
6. Adding/removing `backoffice_access` on a role requires the caller to
   have `change_backoffice_access`.
7. Roles can be created on demand when allowed. Check/uncheck only
   attaches or detaches **already seeded** permission rows (methods on
   a controller, or method-less flags). The API does **not** create new
   controllers/endpoints; developers add those via migration.
8. Domain models above have `deleted_at`. `DELETE` only sets it. Default
   list/retrieve exclude soft-deleted rows. `DELETE /users/{id}` exists
   for permitted callers.
9. Writes to roles/users (and role–permission links) follow audit opt-in
   ([012](../012-auditoria/spec.md)); passwords never appear in audit
   payloads.
10. No backoffice or `web/` UI work in this slice beyond what API
    consumers already need. Constitution 14 and business-model team
    roles updated to `admin` / `sales` / `customer`.

## Permission catalog rule

- **Developer:** adds or changes controllers/endpoints (and their
  method rows / method-less permissions) in a migration.
- **Operator (API):** creates/edits **roles**, and for each role
  checks/unchecks methods that already exist in the catalog.
- **`GET /permissions`:** returns the catalog (controller names and
  methods) for a future panel. Runtime `POST` that invents a new
  controller name is out of scope even if the seed matrix shows
  `permissions` create = 1 — that create means linking/managing the
  catalog surface allowed by the matrix, not inventing endpoints.
  Exact HTTP shape for check/uncheck is a `/plan` concern.

## Open questions

None.

## Out of scope reminders

- Panel Equipo UI and invitation.
- Creating new controllers via API.
- Hard deletes.
- Weakening `active` or password-change gates.

## Approval

Approved 2026-10-02. Plan:
[`plan.md`](./plan.md). Next: `/tasks`.
