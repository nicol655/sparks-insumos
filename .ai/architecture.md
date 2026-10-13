# Architecture

## Overview

A Next.js storefront (`web/`). The account (spec 008) calls `api/`
from server actions: login, registration, `/me`, and logout. The bearer token remains in the HTTP-only cookie `sparks_session`. The catalog follows the contract of `web/src/lib/api/contract.ts`. With `API_MODE=http` (the
stack of `docker/docker-compose.yml`) the storefront reads `GET /products`
publicly. With `mock`, tests and `web/docker-compose.yml` follow in
fixtures.
The central bet remains: the frontend is built **against a contract, not against a backend**, so connecting the catalog to `api/` does not rewrite components.

## Components / boundaries

| Layer | Where | Responsibility |
|-------|-------|-----------------|
| Design tokens | `web/src/styles/theme.css` | Unique source of colors, typography, spacing and breakpoints. The palette and Tailwind radii are **replaced**, not extended |
| Data contract | `web/src/lib/api/contract.ts` | Zod schemas from which types are **inferred**. This is what `api/` must comply with |
| Repository | `web/src/lib/api/` | `CatalogRepository` with two implementations: `mock-repository` (fixtures) and `http-repository` (maps the public JSON of 017 to the contract). `API_MODE` chooses |
| State | `web/src/lib/cart/`, `web/src/lib/ui/` | Cart references + overlays. Zustand. Guest: `localStorage`. Signed-in: server cart via `/me` and `/carts` ([021](specs/021-persistent-cart/spec.md), [ADR-0029](decisions/0029-carrito-persistente-servidor.md)) |
| i18n | `web/src/i18n/`, `web/src/proxy.ts` | Locales, translated routes, dictionaries |
| UI | `web/src/components/`, `web/src/app/[locale]/` | Never call `fetch` or read `src/fixtures`
directly: pass through the repository |
| Chrome | `web/src/components/layout/` + `search/` | Header, banner, mobile menu, footer, FAB, cart hydration, drawer, search overlay and toasts. The layout of `[locale]` mounts it once |
| SEO | `web/src/lib/seo.ts` + `web/public/` | `hreflang` es-AR / en / x-default, Open Graph 1200×630, favicon SVG + PNG 32/180/512 |

The hard boundary is at the repository. A component that calls `fetch` or reads `src/fixtures`
directly breaks the possibility of changing the backend without touching the UI (ADR-0003).

## Docker convention

Every microservice folder has the **same** layout:

```
<service>/
├── Dockerfile
├── docker-compose.yml   # runs this service alone
├── .dockerignore
└── .env.example
```

The `docker/` folder only orchestrates the full stack. It references each service `Dockerfile` [] — never duplicates Dockerfiles.

## Domain resources (selected)

- **Product** — in the storefront: brand, name, olfactory family, size in ml,
  price in ARS integer and images. The GET anonymous does not include cost, sku, code,
  discount or measurements. Notes, concentration and stock are not persisted: the
  mapping leaves them empty or null. Family is one of four slugs
  (`ambar-especias`, `florales`, `gourmand`, `maderas`).
- **Facets** — available values of family, brand and size with their count, plus the price range,
  alimenting the catalog sidebar.
- **CartItem** — `{productId, slug, quantity}`. This is what is saved; the price is recalculated
  always from the repository.

## Key flows

### Page request

`proxy.ts` negotiates the locale and redirects `/` to the prefix that corresponds → the layout of
`[locale]` sets the request locale and loads the dictionary → the page requests data from
the repository → `API_MODE` decides whether to come from fixtures or from `api/`.

### Catalog

The filters live in the URL (`family`, `brand`, `size`, `priceMin`, `priceMax`, `q`, `sort`). In `http`
that query travels as is to `GET /products`; the grid does not filter
again. The order is `name-asc` (default), `name-desc`, `price-asc`,
`price-desc`. The page RSC parses with `fromSearchValues` and requests
`listProducts` + `getFacets`. Each chip is a `Link` to the next query — `router.replace` discards the search in this pathname
(ADR-0007). A combination that would empty the grid is dimmed at 40% and not a link.

### Product detail

`/catalogo/[slug]` requests `getProduct` + `getRelated`. The layout is the one of
`isProduct` in the storefront artefact
([018](specs/018-ficha-producto/spec.md),
[ADR-0025](decisions/0025-ficha-sin-datos-inventados.md)). Name,
description, price, brand, family, size and photos come from
the contract. Without notes there is no pyramid. Without a stock number it does not say
«In stock». In `http` the slug is the uuid and `getRelated` returns `[]`:
the «Also like» section remains with the empty state.
Gallery and purchase are client-side (thumbnails, stepper); the rest is RSC.
The list lives in `catalogo/(grid)/` so that its `loading.tsx` does not
wrap the product detail.

### Cart ([021](specs/021-persistent-cart/spec.md))

**API:** one cart per user (`carts.user_id` unique) with `cart_items`
(product + quantity). Routes under `/carts`: list (admin/sales),
POST/PUT/DELETE for the current user’s cart (`require_permission` on
`cart`). Mutations are audited. Clear is a **hard** delete (no
`deleted_at`; [ADR-0029](decisions/0029-carrito-persistente-servidor.md)).
`GET /me` embeds `cart` or `null`. Empty PUT body is 422 — last line or
clear must DELETE.

**Storefront:** guest browsing still uses Zustand + `localStorage`.
When signed in, `GET /me` is the source of truth (login and
`cart-hydration`); guest lines are not merged. Header badge stays `0`
until `/me` (or guest hydrate) is ready, then shows **units** (sum of
quantities). Agregar → POST if no cart else PUT; quantity / remove →
PUT; last remove or clear → DELETE — via server actions
(`useAddToCart`, `useCartMutations`), never browser `fetch` to `api/`.

`resolveCart()` / `useResolvedCart` still join store references to live
catalog prices and stock. Drawer (`cart-drawer.tsx`) and `/carrito`
(`CartView` + `CartAside`) share the store. WhatsApp checkout still
requires the $30,000 floor.

### Hero and home (003 / 006)

Order: Hero → marquesina → families → featured → Club → `commerce-strip`
(Shipping / Payment / Wholesale). **Without** the T054 block.

Hero copy to the left (`GoldRule` 34×1 + h1 with `titleEm` gold +
CTAs + stats). Figure to the right with `Packshot fill`, pinned to the
marquesina (Cormorant 22px, `text-text-muted`). Families: desc + count,
min-h 250, hover ink. Featured: «Most ordered» + «See all».

Club: h2 34→56, kicker e índices gold **10px** (`GOLD_KICKER` / `GOLD_INDEX`,
ADR-0009). Same scale in commerce-strip, footer and contact. The h1
«We remember.» follows gold large.
Social media from the prototype (`sparks.insumos`). FAB with `border-canvas/20`.

### Search

The trigger (`#header-search`) opens the `search` overlay. Backdrop `rgba(20,16,14,0.55)` + blur,
focus to input, Escape / backdrop / close restores the trigger (AC-12). Chips of note and brand
come from `getFacets` + `listProducts`. From 2 characters it shows up to 4 results.
Enter makes `location.assign` to `/es/catalogo?q=` · `/en/catalogue?q=` (ADR-0008).

### SEO

`seoMetadata()` in `web/src/lib/seo.ts` builds title, description, canonical and
`alternates.languages` (`es-AR`, `en`, `x-default` → es). The layout sets `metadataBase`
(`NEXT_PUBLIC_SITE_URL` or `http://localhost:3000`) and the icons. OG uses `/og.png` (1200×630).
The logos are generated by `web/scripts/write-brand-images.mjs`; a test checks the PNG sizes.

`title` of Next is a plain string. **No** use `title.template` with the placeholder `{page}`
of next-intl — Next requires `%s` and an improperly formatted template throws `generateMetadata`.

### Contact (004)

`/contacto` · `/contact` claims the route that the chrome already linked. A client-side
page (`contact-page.tsx`) + island of form that only does
`preventDefault`. Aside with WhatsApp / email from the proto / Franklin and panel
ink to `wa.me` (`whatsapp.general`). No POST or toast. Kicker gold ≥24px
(RNF-2).

### Checkout

No payment gateway in Phase 1. The cart converts into a WhatsApp message
(`buildWhatsappUrl`) with the order pre-filled; the text comes from the dictionary to be translated.

### Accounts (007)

Implemented in [`specs/007-api-autenticacion/`](specs/007-api-autenticacion/spec.md).
Services `db` and `api` in Compose (`web` does not depend on them). Databases `sparks`
and `sparks_test`. `GET /health` follows for the healthcheck.

- FastAPI + SQLAlchemy async + Postgres, in containers `api` and `db`.
  `web` does not depend on them.
- Bearer token opaque saved hashed in `sessions`. Logout revokes the row.
- `DELETE /me` and `DELETE /users/{id}` soft-delete (`deleted_at`) and
  revoke sessions; they also set `active = false`. Soft-deleted users
  cannot log in or use a bearer ([020](specs/020-roles-permissions/spec.md),
  [ADR-0028](decisions/0028-soft-delete-deleted-at.md)).
- `must_change_password`: the login delivers token, and any other authenticated route
  responds 403 `password_change_required` until
  `POST /auth/change-password`. The base user is born with the flag set to true.
- RBAC ([020](specs/020-roles-permissions/spec.md),
  [ADR-0027](decisions/0027-rbac-catalogo-y-denegacion-opaca.md)): tables
  `roles`, `permissions`, `role_permissions`; every user has `role_id`.
  Protected routes use `require_permission(controller, method | None)`.
  Missing grant returns the same 401 body as missing auth. Seeded roles
  `admin` / `sales` / `customer`; register defaults to `customer`.
  `GET /permissions` is read-only; `PUT /roles/{id}/permissions` replaces
  grants (`change_backoffice_access` when toggling panel access).
  Anonymous `GET /products` stays public; authenticated product reads
  require the grant. Seeded slug `admin` is locked against PATCH /
  DELETE / permission replace (**403**, [ADR-0030](decisions/0030-admin-role-locked-and-super-admin.md)).
  `GET /roles/statistics` aggregates roles for the panel table.
  `users.is_super_admin` is read-only on `UserPublic` (bootstrap user
  only); not used for authorization yet
  ([022](specs/022-role-management/spec.md)).
- Swagger at `/docs`.
- The audit ([012](specs/012-auditoria/spec.md), ADR-0017) is in the
  code: table `audits`, decorator opt-in `audited`, and `GET /audits` more
  `GET /audits/{audit_id}`. The account routes do not call it. The
  catalog of [013](specs/013-productos/spec.md) does: each CRUD successful
  product, category and tag writes a row. Role writes are audited too.
- The storefront calls these routes from server actions (`web/src/lib/auth/`).
  `API_MODE` does not govern the account: always uses `API_BASE_URL`. The catalog
  remains in fixtures. The layout does not read cookies; the link «My Account» checks
  `sparks_signed_in` after mounting.
- Products, categories and tags ([013](specs/013-productos/spec.md),
  ADR-0018) have authenticated CRUD with soft delete and permission deps
  from 020. Photos are uploaded via a port.
  boto3 uses the bucket and keys from `api/.env`. In pytest, an in-memory double. Does not replace the contract of the storefront
  (`web/src/lib/api/contract.ts`). Soft-deleting a product does not purge S3.
- The account page ([009](specs/009-cuenta-fidelidad/spec.md), ADR-0013)
  draws Level, Active Coupon and Orders with `-`, and «Your orders» empty.
  `GET /me` does not include those data. No fake data is invented.
  `UserPublic` includes `role_id` / `role` and nullable `cart`
  ([021](specs/021-persistent-cart/spec.md)); `/me` may include permission grants.
  Cart POST/PUT/DELETE are audited; soft-delete default does not apply to carts
  (hard delete, ADR-0029).

### Backoffice (010)

Service `backoffice/`, container `sparks-backoffice`, host port
`BACKOFFICE_PORT` (3200). Does not share the `sparks_session` cookie.

- Browser login posts to panel `POST /api/auth/login`, which proxies to
  API `POST /auth/login` with `location: "backoffice"` and forwards the
  real status (401/403/200) as JSON (ADR-0014). Without
  `backoffice_access` the API returns 403 `forbidden` and no token.
  Storefront login omits the field (defaults to `"store"`) so customers
  still sign in (ADR-0027).
- The bearer token remains in Zustand, key `sparks-backoffice-session` of
  `sessionStorage` (ADR-0014).
- `AuthGate` waits for rehydration and applies `decideRedirect`: without token, to
  `/unauthorized`; with token, `/login` and `/` go to `/dashboard`.
  Later API denials for missing grants still use opaque 401 and end the
  session (ADR-0020).
- With session, `(panel)` shows the menu, the header, the summary
  in `/dashboard` and the settings in `/ajustes`. The text is fixed
  ([011](specs/011-backoffice-cascaron/spec.md), ADR-0016). Does not call
  `GET /me`. Orders, messages, coupons and content only have
  title. `/usuarios` lists the accounts of 007 and opens the drawer for alta
  and edición
  ([019](specs/019-usuarios-backoffice/spec.md),
  [ADR-0026](decisions/0026-usuarios-del-panel-sin-datos-inventados.md)).
  The Team tab remains empty. The Roles tab lists statistics from
  `GET /roles/statistics`, shows the permissions matrix from
  `GET /permissions`, and opens a drawer for create / edit / duplicate
  ([022](specs/022-role-management/spec.md)). Level, orders, spending and notes are seen
  and not saved. The browser calls to `/api/users`, `/api/roles`, and
  `/api/permissions`; those routes forward to `API_BASE_URL` with the
  bearer. A 401 closes the session.
  `UserPublic` Zod requires `role_id` / `role` / `is_super_admin`
  ([020](specs/020-roles-permissions/spec.md),
  [022](specs/022-role-management/spec.md)).
- `/catalogo` lists the products of 013 and `/catalogo/nuevo` creates them
  ([014](specs/014-catalogo-backoffice/spec.md), ADR-0019). The layout is
  the one from the artefact (ADR-0021): filters, grid and drawer. Family and size
  are saved (`family`, `size_ml`; ADR-0024). Stock, «For» and the
  description in English do not appear and are not saved. The drawer does
  not show the pyramid. Each photo box chooses a file, previews it and cuts the name leaving the extension
  ([015](specs/015-cajon-fotos-sin-piramide/spec.md), ADR-0022). The list shows the first photo with `photo_urls` (GET signed, one hour).
  «Edit» opens that drawer with the saved data and does `PATCH`.
  Published sends only `visibility`. The trash and replacement travel as `photo_slots` and delete in the bucket when saving
  ([016](specs/016-edicion-producto/spec.md), ADR-0023). The browser calls to `/api/catalog/...` in the panel; that route reenvía to
  `API_BASE_URL` with the bearer (`Authorization` or `x-sparks-token`,
  ADR-0020). A 401 closes the session and returns to `/login`. The photo is counted, and also the thumbnail is seen.
- Unit tests do not lift `api`. The gate uses `--no-deps`.

### Standalone
<!-- The concrete pain and the "job" the customer hires the product to do. -->
- _TBD_

### Full stack
<!-- The concrete pain and the "job" the customer hires the product to do. -->
- _TBD_

### PRE frontend deploy
<!-- The concrete pain and the "job" the customer hires the product to do. -->
- _TBD_

## External dependencies

At build time: **none**. The fonts are versioned (ADR-0006) and the build passes with
`--network none`.

At runtime:

- **wa.me** — the checkout ends in WhatsApp. Without SDK: just a link.
- **`api/`** — accounts, session and, with `API_MODE=http`, the catalog.
  `GET /products` and `GET /products/{id}` do not request session. Without bearer the
  body is public (only `visible`, without cost). The home and `/catalogo`
  are built for each request to avoid freezing the list in the build.

No payment gateway, analytics or CMS in Phase 1.

On demand, outside of any build: **Google Fonts**, through the `fonts` stage of the Dockerfile
of `web/`, to regenerate the `.woff2`.
