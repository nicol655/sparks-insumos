# 021 · Persistent shopping cart for wholesalers

- **Status:** implemented (2026-10-05)
- **Date:** 2026-10-05
- **Parents:** [007](../007-api-autenticacion/spec.md) accounts and
  sessions. [008](../008-cuenta-storefront/spec.md) storefront login and
  `/me`. [012](../012-auditoria/spec.md) opt-in audit.
  [013](../013-productos/spec.md) products. [020](../020-roles-permissions/spec.md)
  RBAC seed and `require_permission`. Storefront cart UI from
  [001](../001-storefront-fase-1/spec.md) / [005](../005-cart-page-fidelity/spec.md)
  today persists only in `localStorage`.
- **Source matrix:** spreadsheet attached 2026-10-05 (`admin` / `sales` /
  `customer` × `cart` × methods).

## Problem

A wholesaler who builds a cart on one device loses it on another. The
storefront already paints a cart (drawer, `/carrito`, header badge) from
Zustand + `localStorage`, which cannot follow the account. There is no
server cart, no cart permission rows, and `/me` does not expose cart
state.

## Objective

Persist **one active cart per customer** in the API, expose it on
`/me` and on collection routes under `/carts`, seed the attached `cart`
permission matrix, audit mutating cart calls, and wire the storefront
so login and session recovery reload the cart, the badge counts **units**
after `/me`, and Agregar / quantity / clear call POST, PUT, or DELETE
on `/carts` as appropriate. No backoffice UI in this slice (list endpoint
only, for later integrations).

## Decisions closed (2026-10-05)

| # | Decision |
|---|----------|
| Q1 | Data model: `Cart` 1:1 with `User` (unique `user_id`). M2M with `Product` via association rows that carry `quantity` (not a bare join table). |
| Q2 | Collection paths are `/carts` (no trailing slash required; match existing FastAPI routers). Mutating routes always target the **authenticated user’s** cart — never another user’s id in the path. |
| Q3 | `GET /carts` lists **all** carts. Authorization is `require_permission("cart", "list")` (seeded only for admin and sales, who also hold `backoffice_access`). Customer has `list = 0`. |
| Q4 | Customer reads their cart primarily via `GET /me` → `cart`. `cart` × `retrieve` is seeded per matrix; no `GET /carts/{id}` in this slice (same pattern as unused `me` create/list grants in 020). |
| Q5 | `DELETE /carts` is a **hard** delete of the cart row (and cascade of line rows). Exception to ADR-0028 soft-delete default — see ADR-0029. |
| Q6 | POST / PUT / DELETE are audited (`audited` decorator). GET is not. |
| Q7 | PUT replaces the full line set for the current cart. Removing the last unit triggers `DELETE /carts`, not PUT with empty items. |
| Q8 | Storefront: after successful login, and on load/refresh when the session cookie is present, call `GET /me` and sync the client cart from `cart`. Badge shows `0` until that response; then sum of quantities. |
| Q9 | No backoffice frontend work. Anonymous / guest localStorage cart remains for signed-out browsing; once a session is active, the server cart is the source of truth (ADR-0029). |

## Scope

### In

1. Alembic migration: `carts`, `cart_items` (or equivalent association),
   seed `cart` permission catalog rows and role grants from the matrix.
2. API routes: `GET /carts`, `POST /carts`, `PUT /carts`, `DELETE /carts`
   with `require_permission` and audit on mutations.
3. Extend `GET /me` (and `UserPublic`) with optional/nullable `cart`.
4. Storefront: login → `/me`; session recovery → `/me`; badge units;
   Agregar / quantity / clear → POST \| PUT \| DELETE.
5. API and storefront tests proving the acceptance criteria.

### Out

- Backoffice UI for carts.
- `GET /carts/{id}`.
- Checkout, orders, coupons, stock reservation.
- Merging a pre-login guest cart into the server cart (guest lines are
  discarded when a session loads a server cart; see ADR-0029).
- Changing the WhatsApp checkout floor or visual cart page layout
  beyond wiring data.

## Concepts

| Term | Meaning |
|------|---------|
| **Cart** | One active basket per user. Absent row means empty (no cart). |
| **Cart line** | Product + quantity on a cart. Quantity is units, not SKU rows. |
| **Units count** | Sum of all line quantities (badge). Five of one perfume → `5`. |
| **Hard clear** | `DELETE /carts` removes the cart row from the DB. |

## Permission matrix (`cart`)

| Role | create | edit | delete | retrieve | list |
|------|--------|------|--------|----------|------|
| admin | 0 | 1 | 1 | 0 | 1 |
| sales | 1 | 1 | 1 | 1 | 1 |
| customer | 1 | 1 | 1 | 1 | 0 |

Seed permission **rows** for every method (including denied cells).
Insert `role_permissions` only where the cell is `1`.

## Acceptance criteria

### API & database

1. **Model:** `Cart` 1:1 with `User`; M2M with products via quantity-bearing
   association. At most one cart per user.
2. **`GET /carts`:** lists all carts; requires `cart` + `list`.
3. **`POST /carts`:** creates the cart for the current user; audited;
   requires `cart` + `create`. Conflict if a cart already exists.
4. **`PUT /carts`:** replaces lines on the current user’s cart; audited;
   requires `cart` + `edit`. Missing cart → 404 (client should POST).
5. **`DELETE /carts`:** hard-deletes the current user’s cart; audited;
   requires `cart` + `delete`. Missing cart → 404.
6. **`GET /me`:** includes `cart` (object or `null` when none).
7. **Permissions:** seed matches the matrix above.

### Storefront

8. After successful login, call `/me` and load user + cart into client
   state before relying on the badge or Agregar path that needs cart id
   presence.
9. On first paint / refresh / new tab with an active session cookie,
   verify session and call `/me` for current cart state.
10. Cart badge shows **0** until `/me` has responded for a signed-in
    session; then shows total **units**.
11. **Agregar:** POST if no cart, else PUT with updated lines.
12. **Remove / decrease:** PUT with updated payload.
13. **Clear / last item removed:** DELETE `/carts`.

### Backoffice

14. No panel UI changes. `GET /carts` exists for future use.

## Open questions

None. Payload shape and sync rules are fixed in
[plan.md](./plan.md) and [ADR-0029](../../decisions/0029-carrito-persistente-servidor.md).
