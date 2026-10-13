# ADR 0029: Persistent cart on the server for signed-in users

- **Status:** accepted
- **Date:** 2026-10-05
- **Deciders:** product (approved `/plan` for 021)

## Context

[021](../specs/021-persistent-cart/spec.md) requires a cart that follows
the wholesaler across devices. The storefront today keeps
`{ productId, slug, quantity }` in Zustand + `localStorage`
([001](../specs/001-storefront-fase-1/spec.md)). ADR-0028 makes HTTP
`DELETE` soft-delete via `deleted_at` for domain tables; the story
explicitly asks for a **hard** delete when clearing the cart.
Permission controllers are migration-owned ([ADR-0027](./0027-rbac-catalogo-y-denegacion-opaca.md)).
Storefront account calls go through server actions and an httpOnly
cookie ([ADR-0012](./0012-sesion-storefront-cookie-httponly.md)), not
browser `fetch` to `api/`.

## Decision

1. **Source of truth when signed in.** After login and on session
   recovery, `GET /me` (including `cart`) drives the client cart store.
   The header badge stays at `0` until that `/me` completes. Signed-out
   browsing may still use `localStorage` as today; those guest lines are
   **not** merged into the server cart when a session becomes active
   (server empty → empty client cart after `/me`).

2. **Association object, not a bare M2M.** Tables: `carts` (`id`,
   `user_id` UNIQUE → `users.id`, timestamps) and `cart_items`
   (`cart_id`, `product_id`, `quantity`, PK `(cart_id, product_id)`).
   Quantity lives on the association so the M2M can express units.

3. **PUT replaces the full line set.** The client sends the complete
   desired `items` array. Partial patch is out of scope. When the last
   unit is removed, the client calls `DELETE /carts` instead of PUT with
   `items: []`.

4. **Hard delete on clear.** `DELETE /carts` executes `DELETE FROM carts`
   for the current user’s row (cascade removes `cart_items`). No
   `deleted_at` on carts. This is an intentional exception to
   ADR-0028 for this resource only.

5. **List gate is `cart` + `list`.** Matches the attached matrix and
   020’s `require_permission` pattern. Seeded grants cover admin and
   sales (who also hold `backoffice_access`). Do not invent a second
   gate that only checks `backoffice_access`.

6. **Mutations use JSON route handlers.** Components call same-origin
   `/api/cart` and `/api/me` (fetch). Route handlers read the httpOnly
   `sparks_session` cookie, forward to `API_BASE_URL` with Bearer, and
   **propagate upstream status + JSON** so DevTools Preview shows the
   real API body (same idea as the backoffice login proxy). Components
   never `fetch` `API_BASE_URL` directly. Cart line resolve uses
   `POST /api/cart/resolve` (catalogue join on the server, plain JSON).

7. **Permission controller name is `cart`** (singular), seeded in a new
   Alembic revision alongside the tables. Existing 0005 seed is left
   alone.

## Alternatives considered

- **Keep localStorage as primary and sync in background.** Fails
  cross-device and fights the “badge waits for `/me`” rule.
- **Soft-delete carts.** Contradicts the hard-delete acceptance
  criterion; an empty cart is “no row,” not a tombstone.
- **PATCH for incremental lines.** More endpoints and race cases; the
  story’s POST-or-PUT-full-payload flow is simpler for v1.
- **Merge guest cart on login.** Nice UX, undefined conflict rules, out
  of the written AC; defer.

## Consequences

- Existing cart Vitest/E2E that assume instant local hydrate after
  `rehydrateCart` must distinguish signed-in (wait for `/me`) vs
  signed-out.
- `UserPublic` / storefront Zod gains a `cart` key; strict parsers must
  be updated.
- Admin has `cart` create = 0: an admin account cannot `POST /carts`;
  edit/delete apply only if a cart row somehow exists. Acceptable for
  seeded operators who shop as `customer` or `sales`.
- Audit payloads must not include secrets; cart payloads are product
  ids and quantities only.
