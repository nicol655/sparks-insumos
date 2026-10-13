# Progress

## Current · 2026-10-06 — 022 role management implemented

[022](specs/022-role-management/): **done** (T397–T408). Locked `admin`
role (403), `users.is_super_admin` (bootstrap only), `GET /roles/statistics`,
Usuarios → Roles tab (table, matrix, create/edit/duplicate). ADR-0030.
API pytest 137; ruff clean; backoffice verify green. Web contract only
synced for `is_super_admin`.

Next: other product work, or visual polish of Roles against the artifact
if needed.

## Previous · 2026-10-05 — signed-in cart re-fetches on focus

Signed-in hydration always calls `/api/me` (no `serverReady` skip) and
`CartHydration` re-runs on tab focus/visibility so another browser’s
cart shows up. Guest carts remain localStorage-only per browser.

Next was: panel RBAC UI (now 022).



## Previous · 2026-10-02 — Panel login uses JSON proxy (not server action)

Backoffice login was a Next server action → Network showed **200** +
Flight (`0:{…}`) even for bad credentials. Now `POST /api/auth/login`
proxies to the API and forwards **401/403/200** as `application/json`.
Users/catalog already used that pattern. ADR-0014 updated.

Next: panel UI for roles/permissions (later), or other product work.

## Previous · 2026-10-02 — 020 implemented (T383–T384)

[020](specs/020-roles-permissions/): **done**. Docs: constitution §14,
business-model, glossary, architecture cover RBAC + soft delete.
API ruff clean; pytest 115 passed; backoffice typecheck/lint/test/build
green. Spec and plan marked implemented. No panel RBAC UI; `web/`
unchanged.

Next was: panel UI or other product work.

## Previous · 2026-10-02 — 020 T382 done

[020](specs/020-roles-permissions/tasks.md): **T382** closed.
Backoffice `userSchema` is strict with `role_id` / `role` and optional
nullable `permissions`. Fixtures and contract tests updated. No UI.
Backoffice typecheck/lint/test green.

Next was: **T383** then **T384**.

## Previous · 2026-10-02 — 020 T381 done

[020](specs/020-roles-permissions/tasks.md): **T381** closed. `/me`
uses `require_permission` (retrieve/edit/delete); `DELETE /me` sets
`deleted_at` + `active=false` and revokes sessions. Soft-deleted users
fail login and bearer use. Pytest green; ruff clean.

Next was: **T382**.

## Previous · 2026-10-02 — 020 T379–T380 done

[020](specs/020-roles-permissions/tasks.md): **T379** and **T380** closed.
Users: permission deps, `GET/DELETE /users/{id}`, soft delete + session
revoke; sales cannot delete. Catalog: soft delete (no S3 purge),
`deleted_at` filters, `require_permission` on writes; anonymous product
GET unchanged; auth’d product read checks grants. Pytest 114; ruff clean.

Next was: **T381**.

## Previous · 2026-10-02 — 020 T378 done

[020](specs/020-roles-permissions/tasks.md): **T378** closed. Roles
CRUD + soft delete; `PUT /roles/{id}/permissions` with
`change_backoffice_access` gate; audits on writes. Conftest resets
custom roles and restores seed role rows. API pytest green; ruff clean.

Next was: **T379** or **T380**.

## Previous · 2026-10-02 — 020 T377 done

[020](specs/020-roles-permissions/tasks.md): **T377** closed.
`GET /permissions` and `GET /permissions/{id}` with
`require_permission`; sales gets opaque 401; no invent-controller POST.
API pytest green; ruff clean.

Next was: **T378**.

## Previous · 2026-10-02 — 020 T376 done

[020](specs/020-roles-permissions/tasks.md): **T376** closed.
`UserPublic` includes `role_id` / `role`; register and admin create
default to `customer`; login rejects `deleted_at`; `GET /me` returns
permission grants. API pytest 104 green; ruff clean.

Next was: **T377**.

## Previous · 2026-10-02 — 020 T374–T375 done

[020](specs/020-roles-permissions/tasks.md) started. **T374** migration
`0005` seeds roles/permissions/grants + `deleted_at` + `users.role_id`.
**T375** `load_role_grants` / `has_permission` / `require_permission` and
soft-deleted users rejected in `_resolve`. Unit tests green; ruff clean.

Next was: **T376**.

## Previous · 2026-10-02 — Roles & permissions planned

[020](specs/020-roles-permissions/spec.md) approved.
[plan.md](specs/020-roles-permissions/plan.md) written
([ADR-0027](decisions/0027-rbac-catalogo-y-denegacion-opaca.md),
[ADR-0028](decisions/0028-soft-delete-deleted-at.md)). API-only: seeded
permission catalog, role check/uncheck, `require_permission`, soft
`deleted_at`, opaque 401 denials. No panel UI.

Next was: `/tasks` for 020, then implement.

## Previous · 2026-10-02 — Roles & permissions spec ready for approval

[020](specs/020-roles-permissions/spec.md): Q1–Q7 closed. Controllers
are migration-only; operators check/uncheck methods on roles. Soft
delete, defaults, and API-only scope recorded. No open questions.

Next was: product approves 020, then `/plan`.

## Previous · 2026-10-02 — `progress.md` in English

`.ai/progress.md` is fully English so every prompt pays less for handoff
context. Other historical `.ai/` / `.cursor/` files stay Spanish until
touched. Docs and agent surfaces are English-only going forward
([`50-docs-language.mdc`](../.cursor/rules/50-docs-language.mdc),
[`conventions.md`](conventions.md)). Product UI i18n (`es` / `en`) is
unchanged.

Next was: product work (roles, or real account delete), or rewrite
high-traffic docs as they are edited.

## Previous · 2026-09-30 — Users list and edit accounts

[019](specs/019-usuarios-backoffice/tasks.md) closed (T367–T373,
[ADR-0026](decisions/0026-usuarios-del-panel-sin-datos-inventados.md)).
`/usuarios` shows Clients and Team. Team stays empty. List, create, and
edit talk to `GET/POST/PATCH /users`. Level, orders, spend, and notes are
shown and not saved. Delete account does not remove the row. Block
persists `active`. The menu `10` badge is gone. Pytest 99. Backoffice
Vitest 125. Ruff, typecheck, lint, and panel build green.

Next: roles, or real account delete when orders and coupons are linked.

## Previous · 2026-09-30 — Users plan, no code

[019](specs/019-usuarios-backoffice/plan.md) written
([ADR-0026](decisions/0026-usuarios-del-panel-sin-datos-inventados.md)).
`/usuarios` is still only the title. The plan covers the clients table,
two tabs (Team empty), create drawer and edit drawer, over
`GET/POST/PATCH /users`. Level, orders, spend, and notes are shown and
not saved. Delete account does not remove the row.

Next: `/tasks` for 019, then implementation.

## Previous · 2026-09-30 — product page follows the artifact

[018](specs/018-ficha-producto/tasks.md) closed (T359–T366,
[ADR-0025](decisions/0025-ficha-sin-datos-inventados.md)).
`/catalogo/[slug]` uses the `isProduct` layout. Name, description, price,
brand, family, size, and photos come from the GET. No notes → no
pyramid. No stock → no “En stock”. “También te puede gustar” stays
visible with “Todavía no hay sugerencias.” `getRelated` in `http` still
returns `[]`. `web` verify: typecheck, lint, 559 tests, and build green.
The `home.test.tsx` warning was pre-existing.

Next: related-products endpoint when needed. Or backfill family and size
on already-published products.

## Previous · 2026-09-30 — product-page plan, no code

[018](specs/018-ficha-producto/plan.md) was written. No implementation
yet at that point.

## Previous · 2026-09-30 — signed photo loads

`photo_urls` was signed against `bucket.s3.amazonaws.com`. The regional
bucket returned 307 and the browser saw `SignatureDoesNotMatch` on the
storefront and the panel. `S3Storage` now signs
`https://s3.<region>.amazonaws.com`. On `/catalogo` test photo 1 shows.
The panel uses the same URL; reload `/catalogo` with an open session.

## Previous · 2026-09-30 — storefront reads the catalog

[017](specs/017-vidriera-catalogo/tasks.md) closed (T351–T358,
[ADR-0024](decisions/0024-lectura-publica-y-filtros.md)).
The `docker/` stack uses `API_MODE=http`. `/catalogo` shows published
products. `GET /products` and `GET /products/{id}` do not require a
session; without a bearer the body omits cost. Filters and sort go in
the query. Family and size are stored. Pytest 90. `web` Vitest 548,
backoffice 112. Ruff, typecheck, lint, and both builds green.

Dev DB is on alembic `0004`. A published product without family or size
still appears when those filters are off.

Next: backfill family and size on published products, or a related /
list-over-100 spec.

## Previous · 2026-09-29 — list rejected a 200

The catalog returned 200 with `photo_urls` and the screen said it could
not talk to the catalog. The client chunk still had the old strict
schema. Turbopack ignores `WATCHPACK_POLLING`;
`backoffice/next.config.ts` now sets `watchOptions.pollIntervalMs`.
Delete `/app/.next` and restart `sparks-backoffice` to drop the old
bundle.

[016](specs/016-edicion-producto/tasks.md) still closed (T343–T350).
Pytest 89. Backoffice Vitest 111.

Next: a spec that wires 013 JSON to the storefront, or persist family
and stock (that changes 013).

## Previous · 2026-09-29 — product edit

[016](specs/016-edicion-producto/tasks.md) closed (T343–T350).
The list shows the first photo. Edit opens the drawer and saves with
`PATCH`. Published sends only `visibility`. `photo_slots` replaces or
removes a photo on save. Zero photos still 422. Pytest 89. Backoffice
Vitest 111.

## Previous · 2026-09-29 — plan 016, no code

[016](specs/016-edicion-producto/plan.md) was written
([ADR-0023](decisions/0023-miniatura-y-patch-por-ranuras.md)).
No implementation yet at that point.

## Previous · 2026-09-29 — boto3 reads `api/.env`

The `api` container loads `api/.env` via `env_file`. It no longer
declares empty `AWS_*`, which overrode credentials. The
`create_product_bucket.py` script was deleted: buckets live outside the
repo. Pytest (87) still uses the in-memory double. The 502 was
`AccessDenied`: policy `sparks-dev-s3-police` had a space in the bucket
ARN. Version v2 does not. `PutObject` and `DeleteObject` respond ok.

## Previous · 2026-09-29 — drawer without pyramid

[015](specs/015-cajon-fotos-sin-piramide/tasks.md) closed (T340–T342).
The drawer no longer shows the pyramid. Each slot picks a photo,
previews it, and if the name is too long keeps the extension
(`nombre_mu... .png`). 104 backoffice tests. `npm run verify` green.

Next: a read URL for the photo, or the spec that wires 013 JSON to the
storefront contract. If family and stock must persist, that is another
spec: it changes 013.

## Previous · 2026-09-28 — catalog with artifact layout

[014](specs/014-catalogo-backoffice/tasks.md) still closed.
`/catalogo` and `/catalogo/nuevo` use the artifact layout
([ADR-0021](decisions/0021-catalogo-layout-del-artefacto.md)): filters,
grid, and drawer. “Nuevo producto” opens the drawer over the list.
Family, size, stock, pyramid, and English description are shown and not
saved. A 401 from `/api/catalog/*` clears the session and opens `/login`
(ADR-0020). The proxy also accepts `x-sparks-token` if `Authorization`
is missing. A 403 from password change does not close the session.

Photos are counted, not shown. The storefront still does not read these
products. Photos go to S3 with keys from `api/.env`. If family and stock
must persist, that is another spec: it changes 013.

## Session 37 · 2026-09-29 — S3 credentials

boto3 gets region, bucket, and keys from `api/.env`. Compose no longer
injects those variables empty. No bucket-create script. Container
recreated: all four variables arrive with length. The create 502 was
`AccessDenied` from a space in the `sparks-dev-s3-police` ARN. Version
v2 without that space. `PutObject` and `DeleteObject` ok.

## Session 36 · 2026-09-29 — 015 drawer

T340–T342. No pyramid. Four slots with preview and truncated name.
Vitest 104 green, no Postgres and no AWS.

## Session 35 · 2026-09-29 — plan 015

Spec, plan, and ADR-0022. No code. Pyramid leaves the drawer. Each slot
picks a photo, previews it, and truncates the name keeping the
extension.

## Session 34 · 2026-09-28 — Catalog layout

List and create did not match the artifact. Chrome now does. Create body
is still from 013.

## Session 33 · 2026-09-28 — catalog 401

The list said unauthenticated and `/login` bounced to the dashboard
because the token stayed in Zustand. ADR-0020: second header and
`clearSession` on 401.

## Session 32 · 2026-09-28 — 014 panel catalog

T332–T339. List, create, and proxy. Vitest 92 green, no Postgres and no
AWS. FastAPI 422 still covered by 013 pytest.

## Session 31 · 2026-09-28 — plan 014 panel catalog

Spec, plan, and ADR-0019. Catalog badge `5` is removed in
implementation. No read URL for the photo.

## Session 30 · 2026-09-28 — 013 products

T325–T331. Migration `0003`, three routers, `boto3`, and
`python-multipart`. Pytest 85 green. Login and `/me` still not audited.

## Session 29 · 2026-09-28 — plan 013 products

Spec, plan, and ADR-0018. Money as `numeric(12, 2)`. Category serial is
not in the JSON. Pytest does not call AWS.

## Session 28 · 2026-09-28 — 012 audit

T319–T324. Migration `0002`, opt-in decorator, and two GETs. `api`
pytest: 73 green. Login, register, logout, password change, and `/me` do
not write rows.

## Session 27 · 2026-09-28 — 011 shell

[011](specs/011-backoffice-cascaron/tasks.md) closed (T311–T318).
With a session: menu, header, summary, and settings with artifact copy.
Other sections: title only. No network
([ADR-0016](decisions/0016-cascaron-backoffice-texto-estatico.md)).
64 tests. Backoffice `npm run verify` green.

Roles, logout, password change, and other section bodies remain out of
scope.

## Session 26 · 2026-09-28 — 010 backoffice

Spec, plan, tasks, and implementation. Example-capture login kept in the
Sparks palette. Guard is client-side because `sessionStorage` does not
exist on the server.

## Session 25 · 2026-09-25 — 009 closed (T287–T292)

[009](specs/009-cuenta-fidelidad/tasks.md) closed. `/cuenta` shows Level,
Active coupon, and Orders as `-`, and “Tus pedidos” empty. The center
block no longer sits in a 1180px strip: on wide screens it grows
(`62vw` + gutters) so edge margins match the design capture (~19% each
side). Kicker at 10px / 0.22em, title `clamp(32px, 4.2vw, 52px)`,
buttons at 11px with padding 13×22. Links, buttons, and labels use
`cursor: pointer`. `web` gate (typecheck, lint, test, build) green.
`api/` unchanged. T083 still blocked. `/es/cuenta` without a session
still redirects to sign-in, so the new margin needs an open session.

Next: rest of Phase 2 (sets, checkout).

## Session 24 · 2026-09-25 — plan 008 account

Prototype `QUUhcHp24QBtXkUG8sHPDj` re-read (login, register, account,
drawer, delete dialog). Spec + plan in
`specs/008-cuenta-storefront/`. ADR 0012: bearer in httpOnly cookie;
`sparks_signed_in` only for chrome.

Routes implemented: `/es/ingresar`, `/es/registro`, `/es/cuenta`
(English `/sign-in`, `/register`, `/account`). No `/registrar` or `/me`
pages. Sign-up logs in immediately because 007 does not return a token,
then opens account.

## Session 23 · 2026-09-25 — tasks 007

- Password policy: 8–128, upper, lower, digit, special, no spaces.
  `admin123456` only as migration seed.
- Phone: 6–32 and starts with `+`.
- Session: 6 hours. Logout with the flag true still 403.
- Password change with the flag false: 403 `action_denied`.
- Roles: later task, outside 007.

## Session 22 · 2026-09-23 — gold kickers at 10px (ADR-0009)

TIENDA / CUENTA / Envíos / Pagos / Mayorista / Sparks Club / 01–04 back
to proto: mono **10px** `#8A6B32`. At 24px they read as titles.
“Se recuerda.” stays large gold. Axe ignores only those kickers
(ADR-0009). Next: rest of Phase 2.

## Session 21 · 2026-09-23 — 006 home fidelity (T240–T247)

Home aligned to proto. Docker gate green (**497 tests**). E2E home +
catalog + a11y + copy-elasticity + touch + semantics green. T083 still
blocked.

Next: rest of Phase 2 (login, register, account, sets, checkout) and
`api/`.

### 006 · Home (T240–T247)

- `GoldRule` 34×1 on hero and Club. Marquee Cormorant 22px
  (`text-text-muted`: proto `ink/55` is 4.11:1 and fails axe).
- Families with desc + count, min-h 250, hover ink.
- Featured “Los más pedidos” + “Ver todo”. No `Services` (T054).
- Club h2 34→56 + rule on the kicker. Catalog: crumb “Catálogo · N
  perfumes”.

## Session 20 · 2026-09-23 — plan 006 home fidelity

Home vs proto `QUUhcHp24QBtXkUG8sHPDj` review. Visible gaps: marquee
11px (should be Cormorant 22px), families missing desc/count/hover,
Featured ≠ “Los más pedidos” + Ver todo, extra `Services`, hero rule at
32px (proto 34), club h2 small.

Gold under 24px not implemented (RNF-2): 24px or 34×1 rule.

Next: `/tasks` and `/implement` for 006.

### 006 · Home (proposed)

- `GoldRule` 34×1. Display marquee 22px. Full families.
- Proto featured. Drop T054. Club 34→56 + rule on the kicker.
- P1: catalog crumb.

## Session 19 · 2026-09-23 — 005 cart visuals (T230–T236)

**495 tests**, E2E **133 passed / 15 skipped** on 4 viewports. Typecheck
+ lint + test + build green.

Next: rest of Phase 2 (login, register, account, sets, checkout) and
`api/`. T083 still blocked (coupon rules).

### 005 · Cart (T230–T236)

- Page faithful to proto: h1 “Tu carrito”, empty in a box, rows with
  74px packshot and “c/u”, Summary aside 380px.
- Visual coupon: Apply does not discount or call the network.
- “Finalizar compra” → `wa.me` only if subtotal ≥ $30,000. Below, a
  disabled button. Drawer was not redrawn.

## Session 17 · 2026-09-23 — 004 contact visuals (T220–T224)

**490 tests**, E2E **121 passed / 15 skipped** on 4 viewports. Typecheck
+ lint + test + build green. `/es/contacto` · `/en/contact` no longer
404.

Next: rest of Phase 2 (login, register, account, sets, checkout) and
`api/`. T083 still blocked (coupon rules).

### 004 · Contact (T220–T224)

- Page faithful to prototype: 2 cols ≥900, form 2 cols ≥700, gold kicker
  24px.
- Visual form: 4 `TextInput` + `BoxedTextArea` + “Enviar mensaje”.
  `preventDefault` only; no fetch or toast.
- Aside: WhatsApp / `hola@sparksparfums.com` / Franklin + ink `wa.me`
  panel (canvas + `WhatsappDot`; proto success 10px fails axe).
- Proto email, not the Tiendanube gmail. No cancellation query.

## Session 15 · 2026-09-23 — business model from sparksinsumos.com

Live shop read. `.ai/business-model.md` is no longer TBD. Glossary,
constitution §8–13, and `project.md` aligned. The business **already
has** a Tiendanube catalog; `web/` replaces it.

Next: Phase 2 spec and `api/`. Confirm with the business the floor
($30,000 vs $50,000) and the year (“2019” vs “3 years ago”). T083 still
blocked.

### Facts that bind product

- Cart floor **$30,000** without shipping. 5% / 10% from $100,000 /
  $300,000.
- Live payment: cash or transfer. Shipping Correo Argentino / Via Cargo
  paid by buyer. Franklin. WhatsApp `5491168692694`.
- CUIT `20-95827720-3`. Consumer defense = gob.ar form. Cancellation =
  `/contacto/?order_cancellation_without_id=true` on the live domain.
- Real catalog = 4 families; storefront Phase 1 = perfume only.

## Session 14 · 2026-09-23 — 003 hero + marquee (T210–T213)

**483 tests**, E2E **105 passed / 15 skipped** on 4 viewports. Typecheck
+ lint + test + build green.

Hero and marquee aligned to prototype. T083 still blocked.

Next: Phase 2 spec (checkout, login, register, account, contact) and
the `api/` service.

### 003 · Hero and marquee (T210–T213)

- Stats (references / dispatch / rating) inside the copy column, under
  the CTAs. Value above, label below.
- WhatsApp CTA with 8px `WhatsappDot`. Kicker with 32×1px gold rule.
- “Se recuerda.” in `text-accent-gold` (h1 ≥40px, RNF-2).
- Right image full-bleed (`Packshot fill`): fills the column and meets
  the marquee. Overlaid caption.
- Marquee `bg-surface-raised`, brands `11px` nowrap.

## Session 13 · 2026-09-23 — 002 home footer (T200–T205)

**483 tests**, E2E **101 passed / 15 skipped** on 4 viewports. Typecheck
+ lint + test + build green.

Home close faithful to prototype `QUUhcHp24QBtXkUG8sHPDj`: Club → Envíos
/ Pagos / Mayorista strip → footer + FAB. T083 still blocked (coupon
rules).

Next: Phase 2 spec (checkout, login, register, account, contact) and
the `api/` service.

### 002 · Club, strip, and footer (T200–T205)

- Club rewritten: **Sparks Club** gold 24px kicker, h2, CTAs `/registro`
  and `/ingresar`, benefits `01`–`04`. No WhatsApp. Proto JS copy
  (Franklin, not Palermo).
- `commerce-strip.tsx` between Club and footer. Gold ≥24px (RNF-2).
- Footer: 28px wordmark without tagline, socials `sparks.insumos`,
  Store / Account / Help columns in gold 24px, 13.5px light links,
  copyright bar. Legal links without href. FAB `border-canvas/20`.
- TikTok at 38px wide → `min-w-11`. “Todo el país” heading vs Services →
  `{ exact: true }` in E2E.
- Reserved routes: `/registro` → `register`, `/cuenta` → `account` (404
  until Phase 2).

## Session 12 · 2026-09-23 — corrected spec/plan 002

The club **exists and is wrong**. Between club and footer the Envíos /
Pagos / Mayorista strip is missing. Footer and FAB do not match the
prototype (read from artifact `QUUhcHp24QBtXkUG8sHPDj` on 2026-09-23).

Written then: spec + plan 002. Prototype copy (not OCR): **Sparks Club**
kicker, pickup in **Franklin**, socials `sparks.insumos`. Gold ≥24px.

## Session 11 · 2026-09-22 — Phase 8 polish (T100–T110)

**483 tests**, E2E **97 passed / 15 skipped** on 4 viewports (axe, touch,
copy, semantics, and reduced-motion only on mobile-360). Typecheck +
lint + test + build green.

Storefront Phase 1 **closed** except **T083** (coupon: rules undefined).
Next: Phase 2 spec (checkout, login, register, account, contact) and
the `api/` service.

### Polish (T100–T110)

- E2E i18n: ES→EN change without an extra `load`; cart survives;
  hreflang es-AR / en / x-default.
- Copy at 360px, one `h1` per route, marquee stopped under
  reduced-motion, axe without critical/serious.
- Controls ≥44×44 (`min-h-11`). Cart empty “Ver catálogo” was 10px —
  `inline-flex min-h-11`.
- Gold only ≥24px (`accent-gold.test.ts`). Stock badge and footer contrast
  raised (`text-ink`, `canvas/70`).
- SEO: `seoMetadata()`, OG 1200×630, favicon SVG + PNG 32/180/512.
  Optional `NEXT_PUBLIC_SITE_URL`.
- Context persisted: `conventions.md`, `glossary.md`, `architecture.md`
  (search + SEO), `stack.md` (SITE_URL + E2E commands), `web/README.md`
  no longer create-next-app boilerplate.

## Session 10 · 2026-09-22 — Phase 7 search (T090–T094)

**478 tests**, E2E 84/84 on 4 viewports (search 12). Typecheck + lint +
test + build green.

### Search (T090–T094)

- Trigger extracted to `search-trigger.tsx`: `id="header-search"`,
  `aria-controls="search-overlay"`. Desktop: text + underline; <900px:
  13px icon.
- Overlay: backdrop `rgba(20,16,14,0.55)` + blur 3px, panel `fadeUp`
  280ms, Cormorant 40px input. Focus to input on open; Escape /
  backdrop / close restore the trigger (AC-12).
- Note and brand chips from `getFacets` + `listProducts` (ADR-0003). From
  2 characters, max 4 results in `minmax(220px, 1fr)` (brand, name,
  price).
- Enter does `location.assign` to `/es/catalogo?q=` · `/en/catalogue?q=`
  (ADR-0008).
- E2E in `e2e/search.spec.ts`. After adding client islands, **restart**
  the `web` container if it was already up: old HTML lacks
  `#header-search`.

## Session 9 · 2026-09-22 — Phase 6 cart (T080–T085, without T083)

**466 tests**, E2E 72/72 on 4 viewports (cart 20). Typecheck + lint +
test + build green.

**17 tasks** left (T090–T110 + T083). T083 still blocked by coupon rules.

### Cart (T080–T082, T084, T085)

- Drawer 420px / 92vw, z-101, `slideIn`, focus trapped, Escape returns
  focus to the trigger.
- Add (card and product page) uses `useAddToCart`: persist + overlay +
  toast `role="status"`.
- Header counter waits for `hydrated` (`data-hydrated` on `#header-cart`).
- `/es/carrito` · `/en/cart`: `CartView` island, rows
  `2.4fr 1fr 1fr 0.4fr`, aside 380px.
- Checkout: `buildOrderMessage` + `wa.me` with the detail. No coupon
  (T083).
- Cart E2E hydrates because `allowedDevOrigins` includes `web`
  (ADR-0008).

## Session 8 · 2026-09-22 — Phase 5 product page (T070–T076)

**444 tests**, E2E product page 16/16 on 4 viewports. Typecheck + lint +
test + build green.

**22 tasks** left (T080–T110). T083 still blocked by coupon rules.

### Product page (T070–T076)

- `/es/catalogo/[slug]` · `/en/catalogue/[slug]`: two columns from 900px,
  sticky gallery at `top: 74px`, info column padding `clamp(30 → 48px)`.
- Gallery 4:5 (max 62vh) + 3 thumbs 1:1. No real photos: §05 placeholder.
  `srcset` 400/800/1200/1600 wired for when files exist.
- Pyramid, tech sheet, accordion (description open), related with
  `ProductCard`.
- Purchase: stepper + primary. Out of stock: WhatsApp `whatsapp.stock`.
- Catalog listing moved to `catalogo/(grid)/` so its `loading.tsx` does
  not cover the product page (a streamed parent skeleton over
  `notFound()` never paints the 404).

## Session 7 · 2026-09-22 — Phase 4 catalog (T061–T067)

**427 tests**, E2E catalog 24/24 on 4 viewports (360 / 900 / 1140 / 1440).
Typecheck + lint + test + build green.

**29 tasks** left (T070–T110). T083 still blocked by coupon rules.

### Catalog (T061–T067)

- Route `/es/catalogo` · `/en/catalogue`: h1, 268px sidebar + grid
  `auto-fill minmax(250px, 1fr)`.
- Filters in the URL (`family`, `brand`, `size`, `priceMin`, `priceMax`,
  `q`, `sort`).
- Each chip is a `Link` to the next query (ADR-0007): `router.replace`
  drops search on this pathname, and `onClick` did not hydrate in
  Playwright.
- Chip that would empty the grid: `span` at 40%, not a link (RF-2). Empty
  is reached via shared URL (Gourmand + V.V Love) and shows WhatsApp
  (AC-10).
- Below `xl` (1140) the bar stacks above the grid and loses sticky.
  `FilterDrawer` overlay exists and is tested, but is not mounted on the
  page.
- Sort: `<select>` + `location.assign`. Provisional orders (RF-3).
- Home families already land on `/catalogo?family=…`.

## Session 6 · 2026-09-22 — Home + card (T050–T055, T060)

**394 tests**, E2E home on 4 viewports. Home is no longer a placeholder:
hero, marquee, families, featured, services, and club. Catalog card
exists and is reused by featured.

### Home (T050–T055) and card (T060)

- Hero: single `h1`, CTA to catalog and WhatsApp, 3:2 placeholder art,
  three counters.
- Marquee: brands from `getFacets()`, duplicated track, `data-marquee`
  for reduced motion.
- Families: auto-fit grid, 1px dividers. Link to `/catalogo` (query
  arrives with T062).
- Featured: 4 in-stock products, `ProductCard`.
- Services + club on ink.
- Card adds to cart and opens the overlay; drawer panel not built yet.

## Session 5 · 2026-09-22 — Phase 2 chrome complete (T040–T046)

**382 tests green**, gate passing. This session closed the shared layout:
mobile menu with focus trap, four-column footer, and WhatsApp FAB. Home
is still a placeholder.

### Remaining chrome (T043, T044, T045)

- **Mobile menu** (`mobile-menu.tsx`): full-screen dialog `z-110`,
  Cormorant 30px links with divider, language, sign-in, and `wa.me` CTA
  at the foot. Escape closes and focus returns to the hamburger. Checked
  at ~360px in the browser.
- **Footer** (`footer.tsx`): `1.4fr 1fr 1fr 1fr` / 2 cols <1140 / 1 col
  <700, ink background, inverted wordmark. Store and account reuse chrome
  routes; WhatsApp uses the general message.
- **FAB** (`whatsapp-fab.tsx`): fixed 26px, `z-80`, success dot, hover
  `#4CA455`. Hides when an overlay is open so it does not cover the menu
  or, later, the drawer.

`useFocusTrap` / `useScrollLock` live in `web/src/lib/ui/overlay.ts` and
are shared by the menu (drawer and search will reuse them).

## Session 4 · 2026-09-22 — Phase 2 started: chrome T040–T042 + T046

**366 tests green**, full gate passing. This session mounted the shared
layout: announcement bar, sticky header, language switcher, skip-link,
and cart hydration. Home is still a placeholder; catalog 404s (T061)
**with chrome around it**, as intended.

### Chrome (T040, T041, T042, T046)

The `[locale]` layout now wraps every page with:

- `CartHydration` — reads `localStorage` in an effect (store
  `skipHydration`).
- Skip-link to `#contenido`.
- Announcement bar, disable with `NEXT_PUBLIC_ANNOUNCEMENT=off`.
- Sticky 74px header, grid `1fr auto 1fr` / `auto 1fr auto` under 900px.

Checked in the browser: `/` → `/es`, ES→EN switch translates nav,
announcement, and cart, and `/en/catalogue` (404) becomes `/es/catalogo`
without a full reload. Sets, contact, and sign-in link to reserved
pathnames and 404 until product Phase 2.

§05 icons live in `web/src/components/icons/`. WhatsApp is the 8px
success dot (no official SVG; redrawing it is forbidden). Hamburger:
three 1px rules.

Left in this phase: T043 mobile menu (trigger exists), T044 footer, T045
WhatsApp FAB.

## Session 3 · 2026-09-22 — Phase 1 complete through block 1d

**328 tests green**, full gate (`typecheck`, `lint`, `test`, `build`)
passing, E2E smoke on four viewports. Done this session: T017–T025 (data
and state), T026–T027 (i18n), and T028–T031 (§03 primitives).

### Block 1d · §03 primitives

`web/src/components/primitives/` has the twelve §03 components: three
buttons, four form controls, chip (both forms), badge, skeleton,
accordion, and toast. Plus `icons.tsx`, not in the plan: the
no-literal-string lint flagged the `✕` glyph and §05 wants stroke SVGs,
so they were centralized with a test-verified document contract.

What these tests **do not** cover: pixel values. `padding: 17px 30px`,
48px touch height, and hover colors are CSS; jsdom does not compute
Tailwind. Real-engine checks wait for Playwright. Behavior and semantics
are locked: `aria-pressed`, `aria-expanded`/`aria-controls`,
`aria-invalid` + `aria-describedby`, `aria-busy`, live regions, keyboard
focus, and no axe violations per state.

### Block 1b · data and state

`web/src/lib/api/contract.ts` is the contract the future `api/` service
must meet: types are inferred from Zod schemas, never the reverse.
Behind it, two `CatalogRepository` implementations — `mock-repository`
over fixtures and `http-repository` that validates every response against
the contract — and **one suite of 47 assertions runs against both**. The
fake backend in that test is the executable description of what `api/`
must do.

The repository takes `locale` and returns already-translated copy, as
`api/` will with `Accept-Language`. Brand and product name are not
translated; family and concentration travel as slugs and translate in the
dictionary.

The cart persists **references only** (`productId`, `slug`, `quantity`),
Zod-validated on hydrate; `resolveCart()` joins them to the live product,
recomputes price, and reports out-of-stock or delisted separately. An old
cart cannot freeze a price, and nothing locale-dependent hits disk
(AC-15).

### Block 1c · i18n

Always-prefixed routes (`/es`, `/en`) and translated pathnames
(`/es/catalogo` ↔ `/en/catalogue`). Checked in the browser: `/` redirects
307 to `/es`, both locales return 200 with their dictionary,
`/es/no-existe` is 404, and design tokens still apply under the new
layout.

Dictionaries have a parity test: same keys, same ICU placeholders, no
empty strings, and an explicit allowlist of keys that legitimately match
in both locales — a new match forces a deliberate decide-or-translate.

`no-literal-string` is an **error** on `src/components/**` and
`src/app/**`, verified with a probe component that trips on JSX text,
`alt`, and `aria-label`.

### Versioned fonts (ADR-0006)

`next/font/google` downloaded on every build and randomly failed the
gate. The ten `.woff2` files now live in `web/src/styles/fonts/` via
`next/font/local`. **Checked with networking off**:
`docker run --network none … npm run build` finishes green.

Latin subset only: with `latin-ext` the total was 204KB against a 180KB
budget, and neither site locale uses those codepoints. **136KB**
measured.

Files are regenerated with
`docker compose -f docker/docker-compose.yml run --rm fonts` on demand.

### Open decisions (see open questions 4 and 5 in the spec)

- **Coupon (T083):** no rules defined; store shipped without a coupon.
  Blocks T083.
- **Catalog sort orders (RF-3):** could not be read from the prototype
  (clicks inside the artifact iframe do not register). `contract.ts`
  carries a provisional set marked as such. Nico left it and will confirm
  before T063.

## Session 2 · 2026-09-22 — Phase 0 + block 1a complete

Docker environment up and design system implemented. **92 tests green**,
full gate passing. Done: T001–T007 (setup) and T010–T016 (tokens, fonts,
animations, JSON export).

### Block 1a · design system

`web/src/styles/theme.css` is the token layer: §01 palette, §02 fluid
type scale (15 levels with `clamp`, `line-height`, and tracking), three
families with fallbacks, spacing, the six breakpoints, and motion
defaults. Tailwind palette and radius scale are **replaced, not
extended**: `bg-red-500` and `rounded-lg` simply do not exist.

90 tests compare the file to the PDF tables, including the rule that no
color or type level outside the document appears. Confirmed in the
browser: the page serves `--color-canvas` background, Jost loaded, and
`clamp` applied.

Font budget (RNF-7): **120KB** Latin subset, inside 180KB.
`npm run font-budget` measures it.

```powershell
docker compose -f docker/docker-compose.yml up web                          # dev, hot reload
docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run verify
docker compose -f docker/docker-compose.yml run --rm e2e                    # Playwright
```

Checked by hand: `typecheck`, `lint`, `test` (2 tests), and `build`
pass; E2E smoke passes on four viewports (360/900/1140/1440); production
`runner` stage returns 200. **No Node or browsers on the host** —
everything came from containers.

### Plan deviations, already reconciled in the docs

| What | Why |
|------|-----|
| Next **16.3.5**, not 15 | Current stable; whole stack supports it. ADR-0001 updated |
| Direct `axe-core` instead of `vitest-axe` | Wrapper unmaintained since 2022; types break on Vitest 5. ADR-0005 updated |
| No `vite-tsconfig-paths` | Vite already resolves tsconfig paths natively |
| Configurable `WEB_PORT` | Host 3000 is taken by another project |
| `@types/node` at `^22` | Must track runtime (Node 22) and Vitest 5 |
| Cormorant weights 400 and 500 | §02 lists 300–600, but the scale only uses 400, wordmark 500, italic 400 |

Gotchas that cost time are in `.ai/lessons.md`.

## Session 1 · 2026-09-22 — definition

The repo had no application code yet: only `.ai/` and `.cursor/`, and no
commit on `master`. Today was definition, not implementation.

Access to both design sources was verified (technical-spec PDF and
navigable Claude prototype) and scope the PDF did not cover was decided
with the user.

### Decisions taken with the user

| Topic | Decision |
|-------|----------|
| Data source | Own API in Docker, **to build later**. Storefront builds against a contract defined now and resolved with mocks |
| Checkout | No payment gateway; closes by coordinating payment on WhatsApp |
| Auth | Also deferred to the future backend |
| Phase 1 scope | Home + Catalog + Product + Cart/Drawer. Checkout, login, register, account, and contact go to Phase 2 |
| Testing | Vitest + Testing Library + Playwright, all inside Docker |

### What was written

- `.ai/specs/001-storefront-fase-1/spec.md` — 9 stories, 10 FR, 8 NFR,
  20 verifiable acceptance criteria, 3 open questions (all content; none
  block).
- `.ai/specs/001-storefront-fase-1/plan.md` — stack, file structure,
  token layer, data contract, i18n, Docker, per-criterion test strategy,
  commitments and risks.
- `.ai/specs/001-storefront-fase-1/tasks.md` — 62 tasks in 9 phases, with
  dependencies, critical path, and Definition of Done.
- `.ai/decisions/0001` through `0005` — frontend stack, i18n, decoupled
  data layer, Docker-first, testing strategy. All five `accepted`.
- `.ai/project.md` — completed (was `_TBD_`).

User approved spec and plan on 2026-09-22.

## Next step

[013](./specs/013-productos/tasks.md) closed (T325–T331). The decorator
audits products, categories, and tags. Storefront still on fixtures.
Photo buckets live outside the repo. The API does not create them.
[012](./specs/012-auditoria/tasks.md) still closed.
[011](specs/011-backoffice-cascaron/tasks.md) still closed: panel at
`http://localhost:3200/dashboard`.

[009](./specs/009-cuenta-fidelidad/tasks.md) closed (T287–T292).
[008](./specs/008-cuenta-storefront/tasks.md) closed (T270–T286).
[007](./specs/007-api-autenticacion/tasks.md) still closed (T250–T265).
Password-change UI still out. Sets and checkout still pending and do not
block the backoffice.

**T083** still blocked: coupon mechanism is in the model; live codes and
whether it stacks with the 5/10% and the 5% member rate are missing.

The repository **still has no commit**.

## Context backlog

`architecture.md` describes the 007 accounts API, 012 audit, and 008
storefront.
Standalone / Full stack / PRE deploy remain empty: no publish pipeline.
Account calls `api/` via server actions. Catalog still on fixtures.
