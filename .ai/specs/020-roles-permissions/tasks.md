# Tasks · 020 Roles and permissions

- **Status:** in progress (T374–T384)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0027](../../decisions/0027-rbac-catalogo-y-denegacion-opaca.md),
  [0028](../../decisions/0028-soft-delete-deleted-at.md)

API-only. `web/` UI unchanged. Pytest against Postgres. Backoffice
changes are Zod/`UserPublic` sync only (no panel UI). Behavior tasks
are red → green. Opaque permission denial uses the same 401 body as
missing auth (ADR-0027).

## Foundational

- [x] **T374 · Migration, models, seed** → AC-1, AC-2 (data)
  `api/alembic/versions/0005_rbac_and_soft_delete.py`: `deleted_at` on
  `users`, `products`, `product_categories`, `tags`; tables `roles`,
  `permissions`, `role_permissions`; `users.role_id` NOT NULL after
  backfill. Seed permission catalog (all matrix methods + method-less),
  roles `admin` / `sales` / `customer`, grants for matrix `1`s, assign
  existing users → `customer`, `admin@sparksinsumos.com` → `admin`.
  Models: `api/app/models/rbac.py`, update `user.py`, `catalog.py`,
  `__init__.py`. Test first:
  `api/tests/unit/test_rbac_tables.py` (tables + seed counts / admin
  grants).

- [x] **T375 · `require_permission` + deleted users** → AC-2, AC-4, AC-5
  Depends on T374.
  `api/app/api/deps.py`: reject soft-deleted users in
  `get_authenticated` / login path helpers;
  `require_permission(controller, method | None)` after password
  change; miss → 401 `not_authenticated` / `No autenticado`. Request-
  scoped grant load. Test first:
  `api/tests/unit/test_require_permission.py`.

- [x] **T376 · Auth + `UserPublic` role** → AC-1, AC-5
  Depends on T374. Can follow T375.
  `schemas/auth.py`: `role_id`, `role` (slug) on `UserPublic`; optional
  `role_id` on create/patch. `auth.py` register → `customer`; login
  rejects `deleted_at`. `me.py` returns role (+ permissions list on
  GET `/me` per plan). Adjust existing auth/me e2e fixtures.
  Test first: extend `api/tests/e2e/` auth/register expectations.

## US-1 · US-2 · Catalog & grants API

- [x] **T377 · Permissions list/retrieve** → AC-7
  Depends on T375.
  `api/app/schemas/rbac.py`, `api/app/api/routes/permissions.py`,
  `main.py`. GET list + GET by id; filter `deleted_at IS NULL`; require
  `permissions` list/retrieve. No invent-controller POST.
  Test first in `api/tests/e2e/test_rbac.py` (admin 200; sales 401).

- [x] **T378 · Roles CRUD + check/uncheck** → US-2, AC-6, AC-7, AC-9
  Depends on T377.
  `api/app/api/routes/roles.py`: list/retrieve/create/patch/soft-
  delete; `PUT /roles/{id}/permissions` replaces ids; unknown id →
  422; add/remove `backoffice_access` needs `change_backoffice_access`;
  delete role with users → 409. `@audited` on writes.
  Test first in `test_rbac.py`.

## US-3 · US-4 · US-5 · US-6 · Wire existing resources

- [x] **T379 · Users routes + soft delete** → AC-3, AC-8
  Depends on T375, T376.
  `users.py`: permission deps on list/create/edit/delete/retrieve;
  `GET /users/{id}`; `DELETE /users/{id}` soft + revoke sessions;
  default `role_id` customer on create; lists exclude soft-deleted.
  Update `test_users_admin.py`.
  Test first (delete + sales denied delete).

- [x] **T380 · Catalog soft delete + permissions** `[P]` → AC-3, AC-8
  Depends on T375. Parallel with T379.
  `products.py`, `product_categories.py`, `tags.py`: soft DELETE (no
  S3 purge); reads filter `deleted_at IS NULL`; `require_permission` on
  writes; auth’d product GET requires list/retrieve; anonymous GET
  unchanged. Update `test_catalog.py`; add cases in
  `test_soft_delete.py`.

- [x] **T381 · Me soft delete + permissions** → AC-5, AC-8
  Depends on T375, T376.
  `me.py`: permission deps; `DELETE /me` sets `deleted_at` + revoke.
  Soft-deleted user cannot login. Tests in `test_soft_delete.py` /
  me e2e.

## Polish

- [x] **T382 · Backoffice `UserPublic` sync** `[P]` → AC-10
  Depends on T376. No UI.
  `backoffice/src/lib/users/contract.ts` + colocated tests/fixtures:
  `role_id`, `role` on strict schema.

- [x] **T383 · Docs** `[P]` → AC-10
  Depends on behavior tasks conceptually; can edit anytime after T374
  decisions land.
  `constitution.md` §14, `business-model.md`, `glossary.md`,
  `architecture.md` for RBAC + soft delete.

- [x] **T384 · Verify and handoff**
  Depends on T374–T383.
  `docker compose -f docker/docker-compose.yml run --rm api uv run pytest`
  and ruff; backoffice `npm run verify` if contract touched. Fix root
  causes. Mark tasks done; `plan.md` → implemented; `progress.md`
  updated. `web/` UI unchanged.

## Dependencies

```
T374 ──→ T375 ──→ T377 ──→ T378
         │
         ├──→ T376 ──→ T379
         │         └──→ T381
         │         └──→ T382 [P]
         └──→ T380 [P]
T383 [P]
T374–T383 ──→ T384
```

## Definition of Done

- T374–T384 checked.
- AC-1…AC-10 covered by API pytest (and backoffice Vitest for contract).
- API pytest + ruff green; backoffice verify green if touched.
- `.ai/progress.md` updated with state + next step.
- No backoffice UI; no `web/` UI changes.
