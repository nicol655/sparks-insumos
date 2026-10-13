# ADR 0030: Locked admin role (403) and `is_super_admin`

- **Status:** accepted
- **Date:** 2026-10-06
- **Deciders:** product (approved `/plan` for 022)

## Context

[020](../specs/020-roles-permissions/spec.md) and
[ADR-0027](./0027-rbac-catalogo-y-denegacion-opaca.md) let any caller
with `roles` edit/delete grants soft-delete any non-deleted role,
including the seeded `admin` role. Mutating that role can remove
`backoffice_access` or all grants and strand operators.

[022](../specs/022-role-management/spec.md) also needs a durable marker
for the bootstrap account for **future** privileged checks, without
wiring those checks yet.

Opaque **401** denial (ADR-0027) is for “caller lacks permission.” A
locked system role is a different case: the caller may be allowed to
edit roles in general, but this particular row must not change.

## Decision

1. **Locked role = slug `admin`.** PATCH, DELETE, and
   `PUT /roles/{id}/permissions` on that role return **403** with
   `code: forbidden` and a clear Spanish detail that the administrator
   role cannot be modified. List/retrieve/statistics still include it.

2. **Not an RBAC miss.** Do not use the opaque 401 body for this lock.
   Panel clients can show the API detail without ending the session
   (403 here is not “log out,” unlike 401 — ADR-0020).

3. **`users.is_super_admin`.** Boolean NOT NULL default `false`. Only the
   bootstrap user (`admin@sparksinsumos.com` / configured bootstrap
   email) is set `true` (migration backfill + bootstrap insert). The
   flag is **not** accepted on register, user create, or user patch.
   It is exposed read-only on `UserPublic` for future use. **This slice
   does not authorize any route with it.**

4. **UI.** Hide/disable edit (and delete) for `locked` roles. Duplicate
   may copy `admin` into a **new** role via POST.

## Alternatives considered

- **Opaque 401 on admin lock.** Consistent with permission misses, but
  wrong signal (would log the operator out of the panel) and contradicts
  the 022 AC (403 Forbidden).
- **Lock by `is_super_admin` of the actor.** Rejected for role mutation:
  the invariant is on the role row, not who is calling.
- **DB trigger / CHECK.** Possible later; application guard is enough
  and matches existing DomainError patterns.
- **Omit `is_super_admin` from `UserPublic` until needed.** Rejected:
  Zod `strictObject` and `/me` consumers need a stable shape once the
  column exists; read-only exposure is cheap.

## Consequences

- Callers with full `roles` grants still cannot gut `admin`.
- Future specs may gate privileged actions on `is_super_admin` without
  another migration.
- Implementers must keep statistics / `{role_id}` route order correct
  and keep `is_super_admin` out of write DTOs.
