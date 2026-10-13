# Plan · 021 Persistent shopping cart for wholesalers

- **Status:** implemented (2026-10-05)
- **Spec:** [`spec.md`](./spec.md) (approved)
- **ADRs:** [0029](../../decisions/0029-carrito-persistente-servidor.md).
  Reuses RBAC
  ([ADR-0027](../../decisions/0027-rbac-catalogo-y-denegacion-opaca.md)),
  soft-delete default with **cart hard-delete exception**
  ([ADR-0028](../../decisions/0028-soft-delete-deleted-at.md)),
  audit opt-in
  ([ADR-0017](../../decisions/0017-auditoria-opt-in-y-contexto.md)),
  storefront httpOnly session
  ([ADR-0012](../../decisions/0012-sesion-storefront-cookie-httponly.md)),
  decoupled data layer
  ([ADR-0003](../../decisions/0003-capa-de-datos-desacoplada.md)).

## 1 · Approach

Two coordinated slices:

1. **API:** migration `0006` for `carts` + `cart_items`, seed `cart`
   permissions and grants, schemas, router with four collection
   endpoints, extend `UserPublic` / `GET /me` with `cart`, audit on
   POST/PUT/DELETE, `require_permission` on every cart route.
2. **Storefront (`web/`):** after login and on chrome mount when
   `sparks_signed_in` / session is present, call `GET /me` via existing
   auth client/actions; sync Zustand from `cart`; badge stays `0` until
   that completes; Agregar / quantity / clear call server actions that
   POST, PUT, or DELETE `/carts`. No backoffice UI.

Guest (`localStorage`) path stays for signed-out users only
(ADR-0029).

## 2 · Files

| File | Change |
|------|--------|
| `api/alembic/versions/0006_carts.py` | Tables + seed `cart` permissions/grants |
| `api/app/models/cart.py` | `Cart`, `CartItem` (association) |
| `api/app/models/__init__.py` | Export cart models |
| `api/app/schemas/cart.py` | Request/response DTOs |
| `api/app/schemas/auth.py` | `cart` on `UserPublic`; helper load |
| `api/app/api/routes/carts.py` | GET list, POST, PUT, DELETE |
| `api/app/api/routes/me.py` | Include cart on read (and profile responses if they return `UserPublic`) |
| `api/app/main.py` | Include carts router |
| `api/tests/e2e/test_carts.py` | CRUD, 1:1, permissions, audit, `/me` |
| `api/tests/e2e/test_rbac.py` | Expect `cart` grants in seed |
| `api/tests/conftest.py` | Truncate order for cart tables |
| `web/src/lib/auth/contract.ts` | `cart` on `userPublicSchema` |
| `web/src/lib/auth/client.ts` | Cart client methods (or thin cart module) |
| `web/src/lib/auth/actions.ts` | Login → `/me` sync; cart mutate actions |
| `web/src/lib/cart/store.ts` | Server sync helpers; signed-in ready flag |
| `web/src/lib/cart/use-add-to-cart.ts` | POST vs PUT |
| `web/src/components/cart/*` | Quantity / remove / clear → PUT/DELETE |
| `web/src/components/layout/cart-hydration.tsx` | Session → `/me` before badge ready |
| `web/src/components/layout/header.tsx` | Units count; `0` until ready |
| `web/src/lib/auth/__tests__/*`, `web/src/lib/cart/__tests__/*`, layout/cart tests | AC proofs |
| `.ai/architecture.md` | Short persistent-cart note |
| `.ai/glossary.md` | Persistent cart / units count |
| `.ai/progress.md` | Handoff |

`backoffice/` unchanged. No new Python/npm dependencies.

## 3 · Data model

```text
carts
  id          uuid pk
  user_id     uuid not null unique → users.id ON DELETE CASCADE
  created_at  timestamptz not null default now()
  updated_at  timestamptz not null default now()
  -- no deleted_at (hard delete only)

cart_items
  cart_id     uuid not null → carts.id ON DELETE CASCADE
  product_id  uuid not null → products.id ON DELETE RESTRICT
  quantity    int not null check (quantity >= 1 AND quantity <= 99)
  primary key (cart_id, product_id)
```

- Soft-deleted products (`deleted_at IS NOT NULL`) must not be accepted
  on POST/PUT (422). Listing `/me` / GET `/carts` may omit or keep
  stale lines only if the product still exists; prefer reject unknown /
  soft-deleted ids on write, and on read drop lines whose product is
  missing/soft-deleted when building the public DTO (or return them and
  let the storefront mark unavailable via `resolveCart` — prefer
  **filter out soft-deleted on read** so the badge matches orderable
  units).
- Duplicate `product_id` in a request body → 422 (or coalesce; prefer
  422 for clarity).

### Public cart shape

```json
{
  "id": "<uuid>",
  "user_id": "<uuid>",
  "items": [
    { "product_id": "<uuid>", "quantity": 5 }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

No prices, slugs, or names in the API cart — storefront joins to the
catalog repository (same rule as today’s local references).

### Write body (POST and PUT)

```json
{
  "items": [
    { "product_id": "<uuid>", "quantity": 5 }
  ]
}
```

- POST: `items` may be empty → cart row with zero lines (badge `0`).
  Prefer requiring at least one line on POST if product wants; **allow
  empty** so “create then fill” is possible; Agregar will usually send
  one line.
- PUT: full replace; empty `items` is **422** — client must DELETE
  instead (AC clear).

## 4 · HTTP surface

| Method | Path | Permission | Audited | Behavior |
|--------|------|------------|---------|----------|
| GET | `/carts` | `cart` + `list` | no | All carts, newest first, with items; limit like other lists (e.g. 100) |
| POST | `/carts` | `cart` + `create` | yes | Create for `auth.user`; 409 if cart exists |
| PUT | `/carts` | `cart` + `edit` | yes | Replace lines on current user’s cart; 404 if none |
| DELETE | `/carts` | `cart` + `delete` | yes | Hard delete current user’s cart; 404 if none |

Password-change gate: compose with `require_password_changed` /
`require_permission` like other protected routes.

Audit: `action` create/update/delete, `resource="carts"`, payload =
`{ id, user_id, item_count }` (or full items without secrets). No
tokens/passwords.

### `/me`

`UserPublic.cart: CartPublic | null`. Load with a single query /
selectinload when building `_with_permissions` (or a dedicated helper
used by `read_me` and any response that returns the full public user).
Admin user list does **not** need to embed carts.

## 5 · Permission seed (migration `0006`)

Insert five `permissions` rows: `cart` ×
`create|edit|delete|retrieve|list`.

Grants:

| Role | Grants |
|------|--------|
| admin | edit, delete, list |
| sales | create, edit, delete, retrieve, list |
| customer | create, edit, delete, retrieve |

`retrieve` is seeded for sales/customer but unused by HTTP this slice.

## 6 · Storefront wiring

### Session recovery

Extend `CartHydration` (or a sibling `SessionCartHydration`):

1. If no `sparks_signed_in`, `rehydrateCart()` from `localStorage` as
   today; mark ready.
2. If signed in, keep badge at `0` (`hydrated` / new `serverReady`
   false), call server action → `GET /me`, set Zustand `items` from
   `cart.items` (map `product_id` → `productId`; slug filled by a
   catalog lookup or temporary slug=`product_id` until resolve — prefer
   looking up by id/uuid via existing http repository when
   `API_MODE=http`, else keep uuid as slug for resolve). Mark ready.
3. On `/me` 401: clear session cookies (existing pattern) and fall back
   to empty/local.

### Login

In `createAuthActions.login` (and register’s auto-login path): after
`setSession`, call `getMe`, sync cart into the store **before**
redirect if possible; if redirect is unavoidable first, hydration on
the next page must still call `/me` (recovery path). Prefer syncing in
the action and writing items into a response the client applies, or
rely on hydration always calling `/me` when signed in (simplest:
**hydration always owns `/me` sync**; login only sets cookies +
redirect — recovery AC still holds). Explicit AC “immediately call
`/me`” → call `getMe` in the login action and pass cart into a client
bootstrap, **and** keep hydration `/me` for refresh. Avoid double
visual flicker: hydration no-ops if store already `serverReady` from
login.

### Mutations

| UI | Signed-in behavior |
|----|--------------------|
| Agregar | Build next items in memory; if no server cart id / `cart` was null → POST; else PUT. Update store from response. Open drawer + toast unchanged. |
| Quantity / remove | If resulting items empty → DELETE; else PUT. |
| Clear | DELETE. |

Signed-out: keep current local-only `useAddToCart` / store methods.

Server actions live next to auth (cookie available) and return parsed
cart or error codes; components never `fetch` `API_BASE_URL`.

### Badge

`count = serverReady || (!signedIn && hydrated) ? cartCount(items) : 0`.
Show the numeric span only when ready (same as today’s `hydrated`
gate, extended for session).

## 7 · Docs on implement

- `architecture.md`: cart flow — server cart when signed in; `/me.cart`;
  hard delete; list for operators.
- `glossary.md`: persistent cart, units count.
- Do **not** change constitution 14 (RBAC unchanged aside from new
  controller seed).

## 8 · Test strategy (proves AC)

| AC | Proof |
|----|--------|
| 1 | Unit/migration: unique `user_id`; two products on one cart; same product on two carts |
| 2 | e2e: customer GET `/carts` → opaque 401; sales/admin → 200 list |
| 3 | e2e: customer POST creates; second POST → 409; audit row; admin POST → 401 |
| 4 | e2e: PUT replaces quantities; unknown product → 422; no cart → 404; audited |
| 5 | e2e: DELETE removes row from DB; second DELETE → 404; audited |
| 6 | e2e: GET `/me` includes `cart` or `null` |
| 7 | e2e/rbac: grants match matrix |
| 8–9 | Vitest: login/hydration calls `getMe` and sets items |
| 10 | Header test: signed-in + not ready → `0` / no count; after sync with qty 5 → `5` |
| 11–13 | `useAddToCart` / cart line tests mock actions: POST then PUT; last remove → DELETE |
| 14 | No `backoffice/` file changes in the PR |

API: pytest in Docker. Ruff clean. `web`: typecheck, lint, test (and
build if verify requires). Update cart E2E only if hydration contract
(`data-hydrated` / ready) changes in a breaking way.

## 9 · Risks

| Risk | Mitigation |
|------|------------|
| Guest cart lost on login | Accepted (ADR-0029); document in UI later if needed |
| PUT races (two tabs) | Last write wins; acceptable for v1 |
| Soft-deleted product still in cart | Filter on read; reject on write |
| Admin cannot create cart but has edit/delete | Edge case; operators use sales/customer to shop |
| Double `/me` on login + hydration | `serverReady` short-circuit |
| `userPublicSchema` currently omits role fields from 020 | Extend schema carefully (`cart` + any already-returned fields the strict parse must allow) so `/me` keeps parsing |
| Stock not on API product | Storefront still clamps via `resolveCart` / catalog contract; API does not enforce stock in 021 |

## 10 · Out of scope (reminders)

- Backoffice carts screen.
- `GET /carts/{id}`.
- Guest merge, coupons, checkout, stock reservation.
- Changing WhatsApp minimum or cart page visuals beyond data wiring.

## Next

`/tasks` → ordered checklist (migration + seed → API routes → `/me` →
web sync → mutations → docs → verify).
