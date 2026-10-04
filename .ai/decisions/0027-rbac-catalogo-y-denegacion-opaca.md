# ADR 0027: Seeded RBAC catalog and opaque permission denial

- **Status:** accepted
- **Date:** 2026-10-02
- **Deciders:** product (approved `/plan` for 020)

## Context

[020](../specs/020-roles-permissions/spec.md) replaces constitution 14’s
Administration / Logistics / Content with `admin`, `sales`, and
`customer`. Permissions are controller + method (or method-less
`backoffice_access` / `change_backoffice_access`). Controllers are not
created at runtime. Operators only check/uncheck methods on roles.
Denials must not explain which permission failed. The same
`POST /auth/login` serves storefront and panel.

## Decision

1. **Catalog is migration-owned.** Tables `permissions` and seed rows
   for every controller/method in the 020 matrix (including method-less
   rows with `method IS NULL`). Developers add new controllers in a
   later migration. The API does not `POST` new controller names.

2. **Grants only store allows.** `role_permissions` holds only allowed
   links. Matrix `0` and missing controllers are both “no row” → deny.
   No stored deny flag.

3. **One role per user.** `users.role_id` is required (NOT NULL) after
   migration. Register and unspecified admin creates use slug
   `customer`. Seed admin user gets slug `admin`. Existing users get
   `customer`.

4. **Check/uncheck via roles.** `PUT /roles/{id}/permissions` replaces
   the set of permission ids for that role. `GET /permissions` (and
   retrieve) expose the catalog. No permission-create endpoint that
   invents controllers.

5. **`change_backoffice_access`.** If the new set adds or removes the
   `backoffice_access` permission relative to the previous set, the
   caller must also hold `change_backoffice_access`. Otherwise the
   replace is denied with the same opaque error as any other miss.

6. **Enforcement.** A FastAPI dependency factory
   `require_permission(controller, method | None)` runs after
   `require_password_changed`, loads the actor’s role grants (request-
   scoped), and denies when the grant is absent.

7. **Opaque denial on authenticated routes.** Missing permission raises
   **401** with the same body as a missing/invalid session:
   `code: not_authenticated`, detail `No autenticado`. Clients cannot
   tell “no session” from “no permission”. Panel 401 handling already
   ends the session / shows unauthorized (ADR-0020).

   **Login is different.** `POST /auth/login` accepts optional
   `location`: `"store"` (default) or `"backoffice"`. When
   `location=backoffice`, credentials must be valid **and** the role
   must hold method-less `backoffice_access`; otherwise the API returns
   **403** `code: forbidden` and creates **no** session. Store login
   does not check that grant, so customers keep signing into the
   storefront on the shared endpoint. The panel client always sends
   `location: "backoffice"`.

8. **Authenticated catalog reads.** Anonymous `GET /products` stays
   public. When a bearer is present, list/retrieve require the matching
   products permission.

9. **Constitution.** Principle 14 and `business-model.md` team roles
   are rewritten to `admin` / `sales` / `customer` during implement.

## Alternatives considered

- **403 with a specific permission code.** Clearer for operators; violates
  “do not inform the reason.”
- **Runtime permission CRUD that invents controllers.** Rejected in Q6.
- **Store explicit deny rows for matrix `0`.** Redundant with absence;
  more migration noise.
- **Reject every login without `backoffice_access`.** Breaks storefront
  customers on the shared endpoint. Superseded by the `location` flag:
  only `location=backoffice` checks the grant.

## Consequences

- Backoffice Vitest `userSchema` is `strictObject` — must gain `role_id`
  / role fields when `UserPublic` grows, or verify breaks (contract sync
  only; no panel UI).
- An operator who hits a forbidden route gets the same 401 as an expired
  session; the panel may send them to login. Acceptable under 020.
- A customer (or any role without `backoffice_access`) who tries the
  panel login gets 403 on `/auth/login` and never receives a token, so
  the catalog/users 401 bounce after a “successful” login no longer
  happens.
