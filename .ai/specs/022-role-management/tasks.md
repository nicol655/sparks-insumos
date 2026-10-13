# Tasks · 022 Role management & admin access protection

- **Status:** done (T397–T408)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0030](../../decisions/0030-admin-role-locked-and-super-admin.md)

API harden + backoffice Roles UI. `web/` contract synced for
`is_super_admin` only (no UI). Pytest against Postgres. Backoffice
Vitest + verify. Admin role lock uses **403** `forbidden` (ADR-0030).

## Foundational

- [x] **T397 · Migration + `is_super_admin`** → US-2, AC-2
- [x] **T398 · Backoffice Zod sync** `[P]` → AC-2
  (also `web` `userPublicSchema` for strict parse)

## US-1 · Admin role lock

- [x] **T399 · Lock PATCH / DELETE / PUT-permissions on `admin`** → US-1, AC-1

## US-3 · Statistics + create with grants

- [x] **T400 · `GET /roles/statistics` + `RoleCreate.permission_ids`** → US-3, AC-3, AC-6

## US-4 · Panel transport

- [x] **T401 · Roles / permissions contract, proxy, client** → US-4, AC-4

## US-4 · Panel UI

- [x] **T402 · Roles tab + table + matrix shell** → US-4, AC-4
- [x] **T403 · Role drawer (create / edit / duplicate)** → US-4, AC-5

## Polish

- [x] **T404 · Docs** `[P]` → AC (docs)
- [x] **T405 · Verify API** → AC-1, AC-2, AC-3, AC-6
- [x] **T406 · Verify backoffice** → AC-2, AC-4, AC-5
- [x] **T407 · Full gate + mark implemented** → Definition of Done
- [x] **T408 · Progress handoff**

## Dependencies

```
T397 ──→ T398 [P]
T399 [P with T397] ──→ T400 ──→ T401 ──→ T402 ──→ T403
T404 [P]
T397 + T399 + T400 ──→ T405
T398 + T401–T403 ──→ T406
T404 + T405 + T406 ──→ T407 ──→ T408
```

## Definition of Done

- T397–T408 checked.
- API pytest 137 passed; ruff clean; backoffice `npm run verify` green.
- Spec AC-1…AC-6 covered by paired tests.
- `.ai/progress.md` updated; `is_super_admin` not used to authorize any route.
