# ADR 0028: Soft delete with `deleted_at`

- **Status:** accepted
- **Date:** 2026-10-02
- **Deciders:** product (approved `/plan` for 020)

## Context

[020](../specs/020-roles-permissions/spec.md) maps HTTP `DELETE` to
availability, not physical removal. Catalog routes today call
`session.delete`. `DELETE /me` only sets `active = false`. Audits keep
`ON DELETE RESTRICT` on `users`. Product photos live in object storage.

## Decision

1. Add nullable `deleted_at` (timestamptz) to domain tables in this
   slice: `users`, `roles`, `permissions`, `products`,
   `product_categories`, `tags`.

2. HTTP `DELETE` sets `deleted_at = now()` (and `updated_at` when the
   table has it). It does not remove the row.

3. Default list/retrieve queries add `deleted_at IS NULL`. Soft-deleted
   ids return the same 404 as unknown ids.

4. Soft-deleted **users** cannot log in and fail `get_authenticated`
   (unavailable), distinct from `active = false` (block without delete).
   `DELETE /me` and `DELETE /users/{id}` set `deleted_at` and revoke
   sessions like today’s `/me` delete.

5. **Email uniqueness** stays global: a soft-deleted email remains
   taken (same rule as inactive in 007).

6. **Product photos:** soft delete does **not** delete S3 objects.
   Orphan cleanup is a later purge job. Avoids audit/recover pain and
   failed deletes if storage is down.

7. Soft-deleting a **role** that still has users is **409**. Soft-
   deleting a permission that is still linked to roles is **409** (or
   cascade-unlink only via migration — prefer 409 in API).

## Alternatives considered

- **Hard delete.** Breaks audit FK and 020 availability rule.
- **Reuse only `active` for users.** Spec asks for `deleted_at` on all
  listed models; `active` remains the operator block.
- **Delete S3 on product soft delete.** Couples availability to storage;
  harder to undelete.

## Consequences

- Existing e2e that expect row absence after DELETE must assert
  404 / filtered lists instead.
- Unique constraints on soft-deleted tag names still block reuse until
  a future rename-on-delete or partial unique index — out of 020 unless
  tests force it; prefer keep global unique like email.
