# Plan · 020 Roles and permissions

- **Status:** implemented (2026-10-02)
- **Spec:** [`spec.md`](./spec.md) (approved)
- **ADRs:** [0027](../../decisions/0027-rbac-catalogo-y-denegacion-opaca.md),
  [0028](../../decisions/0028-soft-delete-deleted-at.md).
  Reuses session/password gate
  ([ADR-0011](../../decisions/0011-sesion-borrado-logico-y-clave-obligatoria.md)),
  audit opt-in
  ([ADR-0017](../../decisions/0017-auditoria-opt-in-y-contexto.md)),
  public catalog reads
  ([ADR-0024](../../decisions/0024-lectura-publica-y-filtros.md)),
  panel 401 → session end
  ([ADR-0020](../../decisions/0020-catalogo-401-cierra-sesion.md)).
  Does not change storefront UI
  ([ADR-0003](../../decisions/0003-capa-de-datos-desacoplada.md)).

## 1 · Approach

API-only. One Alembic revision (or a tight pair) that:

1. Adds `deleted_at` to existing domain tables and switches DELETE
   handlers to soft delete.
2. Creates `roles`, `permissions`, `role_permissions`, adds
   `users.role_id`, seeds the 020 matrix, assigns roles to users.

Then: `require_permission` dependency on protected routes; roles +
permissions HTTP surface; register/login/auth updates; minimal
`UserPublic` / backoffice Zod sync so `strictObject` still parses.
No backoffice UI, no `web/` UI.

## 2 · Files

| File | Change |
|------|--------|
| `api/alembic/versions/0005_rbac_and_soft_delete.py` | `deleted_at`, RBAC tables, seed, backfill `role_id` |
| `api/app/models/rbac.py` | `Role`, `Permission`, `role_permissions` |
| `api/app/models/user.py` | `role_id`, `deleted_at` on `User` |
| `api/app/models/catalog.py` | `deleted_at` on product, category, tag |
| `api/app/models/__init__.py` | Export RBAC models |
| `api/app/schemas/rbac.py` | Role / permission / grant DTOs |
| `api/app/schemas/auth.py` | `role_id` (+ role slug) on `UserPublic`; optional `role_id` on create/patch |
| `api/app/api/deps.py` | Soft-deleted user rejected; `require_permission` |
| `api/app/api/routes/roles.py` | CRUD soft + `PUT …/permissions` |
| `api/app/api/routes/permissions.py` | `GET` list + retrieve only |
| `api/app/api/routes/users.py` | Permission deps; soft `DELETE`; `role_id`; filter deleted |
| `api/app/api/routes/me.py` | Soft delete; permission deps; expose role on public user |
| `api/app/api/routes/auth.py` | Register → customer; login rejects `deleted_at` |
| `api/app/api/routes/products.py` | Soft delete; permission deps; auth’d GET checks grant |
| `api/app/api/routes/product_categories.py` | Soft delete; permission deps |
| `api/app/api/routes/tags.py` | Soft delete; permission deps |
| `api/app/main.py` | Include roles + permissions routers |
| `api/tests/e2e/test_rbac.py` | Seed, denials, grants, `change_backoffice_access` |
| `api/tests/e2e/test_soft_delete.py` | DELETE → filtered lists / login |
| `api/tests/e2e/test_users_admin.py` | Adjust for `role_id` + soft delete |
| `api/tests/e2e/test_catalog.py` | Soft delete + permission on writes |
| `api/tests/unit/test_require_permission.py` | Grant / miss / method-less |
| `api/tests/conftest.py` | Truncate order for new tables; helpers for role tokens |
| `backoffice/src/lib/users/contract.ts` | `strictObject` + `role_id` / `role` |
| `backoffice/src/lib/users/__tests__/*` | Fixture shapes |
| `.ai/constitution.md` | Principle 14 → admin / sales / customer |
| `.ai/business-model.md` | Team roles wording |
| `.ai/glossary.md` | Role, permission, soft delete |
| `.ai/architecture.md` | Short RBAC + soft-delete note |
| `.ai/progress.md` | Handoff |

`web/` UI unchanged. No new Python dependencies. Gate unchanged.

## 3 · Data model

```text
roles
  id          uuid pk
  slug        varchar(64) not null unique   -- admin, sales, customer, …
  name        varchar(120) not null
  created_at  timestamptz not null default now()
  updated_at  timestamptz not null default now()
  deleted_at  timestamptz null

permissions
  id          uuid pk
  controller  varchar(64) not null          -- users, products, backoffice_access, …
  method      varchar(16) null              -- create|edit|delete|retrieve|list|NULL
  created_at  timestamptz not null default now()
  updated_at  timestamptz not null default now()
  deleted_at  timestamptz null
  UNIQUE NULLS NOT DISTINCT (controller, method)

role_permissions
  role_id        uuid → roles.id ON DELETE CASCADE
  permission_id  uuid → permissions.id ON DELETE RESTRICT
  primary key (role_id, permission_id)

users
  + role_id    uuid not null → roles.id ON DELETE RESTRICT
  + deleted_at timestamptz null

products | product_categories | tags
  + deleted_at timestamptz null
```

Seed **permission rows** for every cell in the matrix that is `1` or
method-less (presence). Also seed permission rows for matrix `0` cells
so the catalog can show unchecked methods in a future UI — **grants**
only insert where matrix is `1` or method-less present. Controllers with
no sales/customer rows still have catalog permission rows from the
admin columns (full method set for `users`, `roles`, `permissions`,
`me`, `products`, `product-categories`, `tags`) plus the two
method-less permissions.

Seed **roles** `admin`, `sales`, `customer` and their
`role_permissions` per matrix allows.

Backfill: all users → `customer`; `admin@sparksinsumos.com` → `admin`.

## 4 · HTTP surface

### Permissions (catalog read)

| Method | Path | Permission | Behavior |
|--------|------|------------|----------|
| GET | `/permissions` | `permissions` + `list` | Non-deleted catalog; include `controller`, `method` |
| GET | `/permissions/{id}` | `permissions` + `retrieve` | One row or 404 |

No POST/PATCH/DELETE that invents controllers (ADR-0027).

### Roles

| Method | Path | Permission | Behavior |
|--------|------|------------|----------|
| GET | `/roles` | `roles` + `list` | Non-deleted; newest first; limit like users |
| GET | `/roles/{id}` | `roles` + `retrieve` | Role + permission ids |
| POST | `/roles` | `roles` + `create` | `slug`, `name`; empty grants |
| PATCH | `/roles/{id}` | `roles` + `edit` | `name` and/or `slug` |
| DELETE | `/roles/{id}` | `roles` + `delete` | Soft delete; 409 if users still assigned |
| PUT | `/roles/{id}/permissions` | `roles` + `edit` | Body: `permission_ids: uuid[]`. Replace set. Unknown/deleted ids → 422. Adding/removing `backoffice_access` also requires caller `change_backoffice_access` |

Audit create/update/delete on roles and the permissions replace
(`action=update`, resource=`roles`).

### Users / me / auth

- `UserCreate` / `UserAdminPatch`: optional `role_id` (default customer
  on create). Must reference a non-deleted role.
- `UserPublic`: `role_id`, `role` (slug string).
- `DELETE /users/{id}`: soft delete + revoke sessions; needs
  `users` + `delete`.
- Lists/get: `deleted_at IS NULL` (admin user list still includes
  `active = false`, excludes soft-deleted).
- Register: set `role_id` to `customer`.
- Login / `get_authenticated`: reject if `deleted_at` is set (same
  opaque invalid credentials / not authenticated paths as today for
  login vs bearer).
- `DELETE /me`: set `deleted_at`, revoke sessions (keep 007 behavior,
  plus soft delete).

### Catalog

- Writes: `require_permission` for create/edit/delete/list/retrieve as
  mapped below.
- Anonymous GET products: unchanged (no bearer).
- Bearer present on GET products / GET by id: require
  `products` list/retrieve.
- DELETE: soft delete; **do not** call storage delete (ADR-0028).

### Method mapping on existing routes

| Controller | create | edit | delete | retrieve | list |
|------------|--------|------|--------|----------|------|
| users | POST `/users` | PATCH `/users/{id}` | DELETE `/users/{id}` | — (no get-by-id yet; skip or add thin GET if tests need retrieve) | GET `/users` |
| roles | POST `/roles` | PATCH + PUT permissions | DELETE `/roles/{id}` | GET `/roles/{id}` | GET `/roles` |
| permissions | — | — | — | GET `/permissions/{id}` | GET `/permissions` |
| me | — | PATCH/PUT `/me` | DELETE `/me` | GET `/me` | — |
| products | POST `/products` | PATCH `/products/{id}` | DELETE `/products/{id}` | GET `/products/{id}` (auth’d) | GET `/products` (auth’d) |
| product-categories | POST | PATCH | DELETE | GET by id | GET list |
| tags | POST | PATCH | DELETE | GET by id | GET list |

If `users` retrieve has no route today, still **seed** the permission
row; add `GET /users/{id}` in this slice so retrieve is enforceable and
useful (small, consistent with roles).

`me` create/list seeded for matrix completeness; no extra collection
routes required if unused — grants exist, no handler binds them.

## 5 · `require_permission`

```text
require_password_changed → require_permission("products", "edit")
```

- Load grants for `auth.user.role_id` where permission and role are not
  soft-deleted (one query, cache on `Authenticated` or ContextVar for
  the request).
- Method-less: `require_permission("backoffice_access", None)`.
- On miss: `DomainError(401, "not_authenticated", "No autenticado")`
  (ADR-0027).
- Apply to every protected handler in the matrix controllers. Keep
  `ReadyDep` where only password-change mattered; compose both.

Expose current grants on `GET /me` as `permissions: [{controller,
method}]` (method JSON `null` when method-less) so a future panel can
gate `backoffice_access` without a second round-trip. Admin user list
does **not** need full permission arrays.

## 6 · Docs on implement

- Constitution **14**: operator vs customer; roles `admin` (full matrix),
  `sales` (catalog + users without delete + backoffice_access),
  `customer` (storefront; products read when authenticated; no panel).
- `business-model.md` team section aligned.
- Glossary: role, permission, soft delete / `deleted_at`.
- Architecture: RBAC dependency + soft delete default filter.

## 7 · Test strategy (proves AC)

| AC | Proof |
|----|--------|
| 1 | Migration test / e2e: three roles; register → customer; seed admin → admin; existing fixture users → customer; bad `role_id` → 422/404 |
| 2 | Unit: miss controller → deny; sales users delete → deny; grant present → allow |
| 3 | e2e sales token: 401 on `/roles`; 401 on DELETE `/users/{id}`; customer token: 401 on POST `/products`; anonymous GET `/products` 200 |
| 4 | Assert denial body equals unauthenticated shape (no permission name) |
| 5 | Soft-deleted user login → invalid credentials; inactive unchanged; login without `backoffice_access` still 200 |
| 6 | Role without `change_backoffice_access` cannot PUT grant that adds `backoffice_access`; admin can |
| 7 | POST `/permissions` inventing controller → 405/404; PUT role permissions with unknown id → 422; POST `/roles` 201 |
| 8 | DELETE product → still in DB with `deleted_at`; GET list omits; GET id 404; DELETE `/users/{id}` 204 |
| 9 | Audit rows on role create/update without secrets |
| 10 | No panel UI files; constitution/business-model updated; backoffice Zod only |

Pytest against Postgres in Docker. Ruff clean. Backoffice verify if
contract touched.

## 8 · Risks

| Risk | Mitigation |
|------|------------|
| Opaque 401 logs operators out of the panel on forbidden clicks | Accepted (ADR-0027); later panel can hide nav by grants from `/me` |
| Soft delete + global unique email/tag blocks reuse | Same as 007 inactive email; document |
| Large grant query per request | One select per request, cached on actor |
| Catalog e2e assumed hard delete | Update assertions to soft delete |
| `permissions` create/edit/delete in matrix unused by HTTP | Seeded for catalog/checkboxes; no invent-controller API |

## 9 · Out of scope (reminders)

- Equipo UI, role picker, permissions matrix screen.
- Hard deletes and S3 purge.
- Coupons / orders / settings controllers.
- Changing storefront pages.

## Next

`/tasks` → ordered checklist (migration → deps → routes → wire
permissions → soft delete → docs → verify).
