# Tasks · 021 Persistent shopping cart for wholesalers

- **Status:** done (T385–T396)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0029](../../decisions/0029-carrito-persistente-servidor.md)

API + storefront. No backoffice UI. Pytest against Postgres. Web
Vitest (+ verify). Behavior tasks are red → green. Opaque permission
denial uses the same 401 body as missing auth (ADR-0027). Cart clear is
hard delete (ADR-0029).

## Foundational

- [x] **T385 · Migration, models, seed** → AC-1, AC-7
  `api/alembic/versions/0006_carts.py`: tables `carts` (unique
  `user_id`, no `deleted_at`) and `cart_items` (`cart_id`,
  `product_id`, `quantity` 1–99, PK composite). Seed five `cart`
  permission rows and role grants per matrix (admin: edit/delete/list;
  sales: all five; customer: create/edit/delete/retrieve). Models:
  `api/app/models/cart.py`, export in `__init__.py`. Update
  `api/tests/conftest.py` truncate order. Test first:
  `api/tests/unit/test_cart_tables.py` (tables, unique user, seed
  grants).

- [x] **T386 · Cart schemas + helpers** `[P]` → AC-1, AC-6
  Depends on T385 models existing (can land with or just after T385).
  `api/app/schemas/cart.py`: write body (`items`), `CartPublic` /
  line DTO. Helpers to validate product ids (exist, not soft-deleted),
  reject duplicate `product_id`, build public cart filtering
  soft-deleted lines on read. Unit tests colocated or in
  `api/tests/unit/test_cart_schemas.py`.

## US-1 · API cart surface

- [x] **T387 · Cart routes (CRUD collection)** → AC-2, AC-3, AC-4, AC-5
  Depends on T385, T386.
  `api/app/api/routes/carts.py` + `main.py`: `GET /carts` (`list`),
  `POST /carts` (`create`, 409 if exists), `PUT /carts` (`edit`, 404 if
  none, empty items → 422), `DELETE /carts` (hard delete, 404 if none).
  `@audited` on POST/PUT/DELETE. Compose password-change +
  `require_permission`. Test first: `api/tests/e2e/test_carts.py`.

- [x] **T388 · `/me` embeds `cart`** → AC-6
  Depends on T385, T386. Can follow or parallel with T387 after helpers.
  `schemas/auth.py` + `me.py`: `UserPublic.cart: CartPublic | null`.
  Load current user’s cart with items on GET `/me` (and other
  `UserPublic` returns from me that should stay consistent). Admin user
  list does not embed carts. Extend `test_carts.py` / me e2e.

- [x] **T389 · RBAC seed assertions** `[P]` → AC-7
  Depends on T385.
  Update `api/tests/e2e/test_rbac.py` (and any permission count
  fixtures) for `cart` controller grants. Customer denied `list`;
  admin denied `create`.

## US-2 · Storefront session + badge

- [x] **T390 · Auth contract + cart client** → AC-6, AC-8
  Depends on T387, T388 (API shapes stable).
  `web/src/lib/auth/contract.ts`: `cart` on `userPublicSchema` (and
  role fields if strict parse already receives them). Cart wire types.
  `web/src/lib/auth/client.ts` (or `web/src/lib/cart/api.ts`):
  `getMe` parses cart; `createCart` / `replaceCart` / `deleteCart`.
  Test first: contract + client tests.

- [x] **T391 · Store sync + hydration** → AC-8, AC-9, AC-10
  Depends on T390.
  `web/src/lib/cart/store.ts`: apply server cart items; `serverReady`
  (or equivalent). `cart-hydration.tsx`: signed-out → localStorage
  rehydrate; signed-in → `/me` then sync, badge stays 0 until ready;
  401 clears session. Header uses units count only when ready.
  Login action calls `getMe` after session set (AC-8); hydration
  short-circuits if already `serverReady`. Tests: hydration, header,
  store, auth actions.

## US-3 · Storefront mutations

- [x] **T392 · Agregar → POST | PUT** → AC-11
  Depends on T391.
  Server actions for cart mutate (cookie jar). `use-add-to-cart.ts`:
  signed-in builds next lines → POST if no cart else PUT; update store
  from response; drawer + toast unchanged. Signed-out keeps local add.
  Test first with mocked actions.

- [x] **T393 · Quantity / remove / clear** → AC-12, AC-13
  Depends on T392.
  Cart line / view / drawer / clear paths: PUT with updated payload;
  last item or explicit clear → DELETE. Tests colocated.

## Polish

- [x] **T394 · Docs** `[P]` → AC-14
  Depends on decisions (can edit after T385).
  `architecture.md` persistent-cart flow; `glossary.md` persistent
  cart / units count. No constitution §14 rewrite. No `backoffice/`
  UI files.

- [x] **T395 · Verify API** → AC-1–7
  Depends on T385–T389.
  `docker compose -f docker/docker-compose.yml run --rm api uv run pytest`
  and ruff. Fix root causes.

- [x] **T396 · Verify web + handoff** → AC-8–14
  Depends on T390–T395, T394.
  `web` verify (typecheck/lint/test/build per `.cursor/verify.json`).
  Mark tasks done; `plan.md` / `spec.md` → implemented; `progress.md`
  updated. Confirm no backoffice UI changes.

## Dependencies

```
T385 ──→ T386 ──→ T387 ──→ T390 ──→ T391 ──→ T392 ──→ T393
         │         └──→ T388 ──┘
         └──→ T389 [P]
T394 [P]
T385–T389 ──→ T395
T390–T395 + T394 ──→ T396
```

## Definition of Done

- T385–T396 checked.
- `/verify` (api + web checks in `.cursor/verify.json`) green.
- `.ai/progress.md` states 021 closed and the next product step.
- No backoffice cart UI; `GET /carts` API-only for later.
