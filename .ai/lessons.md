# Lessons

Obvious gotchas that cost time. Specific and actionable.

## Backoffice

### A 401 from the catalog should not leave the token in Zustand

The dashboard does not call the API. If `/api/catalog/*` responds with a 401 and `accessToken` is still different from `null`, `decideRedirect` sends the user back to `/login`. The operator sees "not authenticated" and cannot log in again.

That 401 can be from the proxy (`forwardCatalog` did not see the bearer token) or FastAPI (`Not authenticated`). In both cases, you need to `clearSession()` and `replace("/login")`. If only the token is cleared, the store will send the private route to `/unauthorized`, and the `replace("/login")` will fail. `preferLogin` converts that bounce into `/login` (ADR-0020). A 403 from changing a password does not clear the token. The client sends the token in `x-sparks-token` because the route handler sometimes does not receive `Authorization` even though the store has the token.

### Next in development prints the arguments of the server action

`next dev` writes to the container log the call, with the body:

```txt
ƒ loginAction({"email":"…","password":"…"})
```

This is not our `console` (`client.ts` does not log). In development, `docker logs sparks-backoffice` shows the password. No extra logging is needed. When looking at those logs, do not paste the body in the chat or a ticket.

### A new route can remain 404 until restarting `next dev`

With the bind mount, creating `src/app/(panel)/` while `sparks-backoffice` is already up left `/dashboard` as 404 even though the file exists. The production build sees the route. Restarting `sparks-backoffice` and waiting for the healthcheck.

### `WATCHPACK_POLLING` does not recompile Turbopack

The catalog responded with a 200, but the screen said "We couldn't talk to the catalog". The JSON had `photo_urls`. The client chunk still had the old `strictObject`, without that key, and `safeParse` rejected it.

`WATCHPACK_POLLING` is read by Webpack. Turbopack uses `watchOptions.pollIntervalMs` in `backoffice/next.config.ts`. If the bundle is already stale, you need to delete `/app/.next` (anonymous volume) and restart `sparks-backoffice`. A simple restart does not clear that cache.

## API

### The signed URL must use the regional endpoint

`generate_presigned_url` without `endpoint_url` signs
`bucket.s3.amazonaws.com`. The bucket in `eu-north-1` redirects to the regional host and that redirection invalidates the signature
(`SignatureDoesNotMatch`). The photo uploads, but the GET from the browser fails, both in the storefront and in the panel, because both use `photo_urls`.

`s3v4` signs against `https://s3.<region>.amazonaws.com`. Do not go back to the global host.

### Do not reuse the name `_read_one`

`products.py` already has `_read_one` as payload of `@audited` in the GET.
A new function with the same name overwrites it, and the decorator ends up calling the file reader with `result=`. The reader for an upload is called `_read_upload`.

### Compose cannot declare `AWS_*` empty

`api/docker-compose.yml` interpolates `AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:-}`
(yet the rest). If the host does not have these, the container receives the variable
present and empty. pydantic-settings prefers the environment to `.env`, so
`api/.env` does not reach boto3. The credentials only enter via
`env_file: .env`. Do not declare those four keys again in
`environment`.

### Alembic from pytest cannot use `asyncio.run` in the same loop

`alembic/env.py` calls to `asyncio.run`. If a pytest-asyncio async fixture
does `command.upgrade` in the same process, it fails with «this event loop is
already running». `tests/conftest.py` runs `alembic upgrade head` in a
subprocess, with `ALEMBIC_DATABASE_URL` pointing to `sparks_test`.

### The app engine cannot reuse connections between tests

pytest-asyncio opens an event loop per test. The pool of `app.db.engine`
keeps asyncpg connections tied to the previous loop and the next request
fails with «Future attached to a different loop». In e2e,
`_point_app_at_test_database()` substitutes that engine by one to
`sparks_test` with `NullPool`, so each request opens the connection in the test's loop.
The test has to use `db.SessionLocal` after that substitution. A `from app.db import SessionLocal`
at the top of the module
stays pointing at the original engine (`sparks`, with pool) and the insert does not see the table that Alembic created in `sparks_test`.

### `httpx.AsyncClient` does not send `files=`

In this version, `await client.post(..., files=...)` builds a synchronous stream
and fails with «Attempted to send an sync request». The e2e
for products builds the multipart manually and sends it in `content`.

## Docker

### `API_MODE=http` in the stack's compose file should not control Vitest

`docker/docker-compose.yml` leaves the `web` service in `http` so that
the storefront reads `GET /products`. `npm test` uses the same compose, so
the container inherits `API_MODE=http` and the cart and search
request `http://api:8000`. `web/vitest.config.mts` sets `API_MODE=mock`:
the tests continue in fixtures. `web/docker-compose.yml` also stays
in `mock`.

### Pytest does not migrate the development database

`alembic upgrade` from the conftest runs on `sparks_test`. The development
database `sparks` of the container `sparks-db-1` falls behind and `GET /products`
responds 500 (`column products.family does not exist`). You need to
`docker exec sparks-api-1 uv run alembic upgrade head` and restart
`sparks-api-1`.

### The Next healthcheck should use `127.0.0.1`, not `localhost`

`next dev -H 0.0.0.0` listens **only on IPv4**. Inside the container `localhost` resolves first
to `::1`, so `wget --spider http://localhost:3000` returned «connection refused» indefinitely, the container was `unhealthy` and the `e2e` service aborted with
«dependency failed to start».

The symptom is misleading: the Next logs say `✓ Ready` and `Network: http://0.0.0.0:3000`, so
it seems a boot problem when in reality it's name resolution.

Rule: in container healthchecks, always use `127.0.0.1`.

### The port 3000 on the host is often occupied

Other projects on the same machine take it. That's why the mapping is `${WEB_PORT:-3000}:3000` and
there's `docker/.env.example`. On Nico's machine, `WEB_PORT=3100` (the 3000 is taken by `ads-cloud-web`).

## Tooling

### Next 16 needs `next typegen` before `tsc --noEmit`

The layout that generates `create-next-app` uses the global type `LayoutProps`, which Next produces in
`.next/types` during `dev` or `build`. A `tsc --noEmit` in cold —clon fresh, CI— fails with
`Cannot find name 'LayoutProps'`. That's why the script is `next typegen && tsc --noEmit`.

### `vitest-axe` is dead and breaks with Vitest 5

The version 0.1.0 (2022) declares its matchers increasing the global namespace `Vi`, convention that
Vitest 5 no longer reads: `Property 'toHaveNoViolations' does not exist`. Maintaining it would require a type shim for a package without maintenance, with six transitive dependencies behind.

It uses `axe-core` directly from `web/src/test/a11y.ts`. See ADR-0005.

General lesson: when a testing wrapper fails only in the types, check the last
release date of its version before writing a type shim.

### `@types/node` should follow the runtime, not the playground

`create-next-app` sets `@types/node@^20`, but the image is Node 22 and Vitest 5 asks
`^22 || >=24`. The result is an `ERESOLVE` that invites to use `--legacy-peer-deps`. The real cause
was the wrong version: bumping it to `^22` resolves the conflict without forcing anything.

## Typography and tokens

### The budget for fonts is measured by subset, not by folder

`du -sh .next/static/media` gave 369KB against a target of 180KB, which seemed a
serious breach. It wasn't: `next/font` downloads **all** the subsets that Google publishes
(greek, cyrillic, vietnamese) and generates an `@font-face` with its `unicode-range` for each one. A reader in Spanish or English only downloads the latin subset. The real figure is 120KB.

This stopped applying with ADR-0006: now a file per face, latin subset, versioned,
and `npm run font-budget` only measures `src/styles/fonts/` without building anything. We keep the anecdote
because it explains why a `du -sh` figure on a build output **does not** reflect the budget.

### Prettier converts CSS hex values to lowercase

The PDF writes colors in uppercase and `theme.css` also, until it runs `npm run format`.
The token tests compare without distinguishing case: a color box doesn't mean anything and it
isn't worth excluding the file from formatting for that reason.

### `next/font/google` was causing intermittent build failures — resolved

It downloaded the fonts **in each build**. One failed with twenty errors
`Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'` and
`next/font/google queries have exactly one entry`; the next, without changing anything, passed.

Resolved in ADR-0006: the `.woff2` are versioned and `next/font/local` is used. If it reappears a build error,
the first thing to look for is what reintroduced it.

Two things that cost discovering on migration:

- The Google Fonts API returns the **TTF complete** if requested with an old user agent
  (`Mozilla/4.0`); with a modern one, it returns woff2 already chunked by subset. That allows cutting a single file per face with `pyftsubset` instead of having to join the chunks from Google.
- `next/font/local` **does not accept `unicode-range` per file**: `src` only accepts `path`, `weight` and
  `style`. Two files of the same family, weight and style collide, so they can't be served
  latin and latin-ext as separate files of a single family.

To check that a build no longer depends on the network:

```powershell
docker run --rm --network none -v D:/projects/sparks/web:/app -v /app/node_modules -v /app/.next -w /app sparks-web:latest npm run build
```

## i18n

### A `loading.tsx` parent swallows the `notFound()` of the page

`catalogo/loading.tsx` wraps also `/catalogo/[slug]`. If the page calls
`notFound()`, Next streams the skeleton and the fallback 404 fails in the
client (0 `<h1>`). The grid lives in `catalogo/(grid)/` so that its loading
does not cover the page. The page **does not** have a `loading.tsx`: the `notFound()` has to win over the stream.
It has its own `not-found.tsx`.

### The root layout lives inside `[locale]`

With `next-intl` and route prefix, `app/[locale]/layout.tsx` **is** the root layout and not exists
`app/layout.tsx`. A subtle consequence: a `notFound()` does not have anywhere to render for routes that do not match,
so it needs `app/[locale]/[...rest]/page.tsx` that calls `notFound()`.

Next 16 also deprecated `middleware.ts`; the file is called `proxy.ts` (same content and same
signature).

### `no-literal-string` in mode `jsx-text-only` does not check attributes

It lets pass `alt="Frasco"` and `aria-label="Cerrar"`, which is just the text that AC-20 watches. The correct mode
is `jsx-only` with `jsx-attributes.include` limited to visible attributes; without that
list, `jsx-only` would mark also `className` e `id`.

When setting up a lint rule, check that **triggers** with a probe component. That the lint
passes does not prove that the rule is active.

### `router.replace(pathname)` does not accept typed dynamic routes

`usePathname()` of next-intl returns the *name* of the route (`/catalogo/[slug]`), not the full URL
filled. `router.replace(pathname, { locale })` does not typecheck and, worse, loses the slug. The documented pattern is `{ pathname, params }` with `useParams()` from `next/navigation`. You have to cast:
the types of `replace` do not accept that union. Checked in the browser:
`/en/catalogue` → `/es/catalogo`.

### `useSearchParams` in Chrome breaks the prerender of the whole page

The header lives in the `[locale]` layout. If the language selector reads
`useSearchParams()`, Next requires a `<Suspense>` around and, without it, `next build` fails in `/es`
with `missing-suspense-with-csr-bailout`. The filter query is read on click from
`window.location.search`, which is the moment when it's needed and does not contaminate the prerender.

### Changing filters cannot go through `router.replace`

`router.replace('/es/catalogo?x=1')` and `router.replace('?x=1')` (next/navigation and next-intl)
leave the URL as `/es/catalogo` without query: the proxy treats the pathname as invariant.

The chips are `Link` of next-intl with `{ pathname: "/catalogo", query }` — the same pattern
that the families in the home, and that writes the search string. An `onClick` +
`location.assign` does not work: in Playwright those buttons do not hydrate and the click does nothing.
The select for sorting uses `location.assign` (cannot be a link). See ADR-0007.

## E2E

### Playwright against `http://web:3000` does not hydrate without `allowedDevOrigins`

Next 16 + Turbopack cuts the HMR WebSocket if the `Host` is not a known development origin.
The E2E sees server HTML, `__reactFiber` does not appear and
any `onClick` is a no-op. The `Link` still works (real navigation),
so the catalog passed and the cart failed.

Rule: `allowedDevOrigins` includes `web` (ADR-0008). Before a client click,
wait for `#header-cart[data-hydrated=true]`.

### The running `web` container serves an old Chrome

Adding a new file (`SearchOverlay`, an `id` in the header) and running E2E against a
`sparks-web-1` that was already `healthy` fails as if the click did not hydrate: the snapshot
shows `aria-expanded` (the store of the old header opens) but no dialog, or
`#header-search` does not exist. The bind mount updates the source; Turbopack does not always
recompile the layout.

Rule: after new islands in the layout, `docker compose … restart web` and wait
`healthy` before the E2E.

With hydration, a `Link` of next-intl does client-side navigation and the chips from the catalog keep the
`query` from the RSC previous: the second filter overwrites the first.
The chips are `<a href>` native (`catalogUrl`) to reload.

### `title.template` with `{page}` kills `generateMetadata`

Next interpolates `metadata.title.template` with `%s`. Passing it the `{page}` of next-intl
throws `FORMATTING_ERROR` / `Missing metadata.titleTemplate` and the page is served as `__next_error__` (html without `lang` ni title). Axe then marks
`document-title` and `html-has-lang` in *all* routes. The layout uses
`title: t("title")` plain; the pages pass their own title by `seoMetadata()`.

### The skip-link does not enter touch or overflow

`.sr-only` is clipped to 1×1. If the E2E of AC-15 / AC-17 measures it, it fails.
Exclude `.sr-only` (and `[aria-hidden='true']`) from those measurements.

### `prefers-reduced-motion` leaves `animationName` empty, not `"none"`

`page.emulateMedia({ reducedMotion: "reduce" })` in Chromium for the marquee:
`getComputedStyle().animationName` is `""` and `transform` is `none`. Accept
both; do not require the literal `"none"` in `animationName`.

### Gold kickers at 10px (ADR-0009)

24px in TIENDA / Envíos / Sparks Club / 01–04 turns into titles.
The proto is 10px `#8A6B32`. On canvas Chrome marks 4.4:1 (warning). On
ink, a lighter gold (`oklch(0.72 0.09 85)`) reaches 7.5:1. Do not raise the
kicker to 24px to “fix” the warning.

### Contrast: `text-ink/55` at 22px does not pass AA

The proto paints the marquee `rgba(20,16,14,0.55)` over `#FBF9F5`. Axe mides
4.11:1 (needs 4.5:1; 22px regular is not «large text»). Use
`text-text-muted` (`#3E3731`). Do not relax the E2E of axe.

### Contrast: `canvas/40` and `text-success` fail at 10px

`#4CA455` over canvas is 2.76:1; `text-canvas/40` over ink is 3.52:1. Axe
`color-contrast` marks them in the footer and in the stock badge. Use
`text-canvas/70` and `text-ink` for small copy; the green success stays for
the non-text part of the FAB.

### Thumbnails and underlined links measure the glyph, not the hit area

A thumbnail whose `<button>` wraps a placeholder without `block w-full` is 2×2px.
An underlined link from `text-label` without `inline-flex min-h-11 items-center`
is ~10px high (the empty space of the cart «Ver catálogo»). AC-15 requires these two
classes in all controls that are not a button from the §03.

"TikTok" to `text-mono-meta` is 38×44: `min-h-11` is not enough. Labels short
of social networks also need `min-w-11`.

### `getByRole('heading', { name })` is substring

«Todo el país» matches the h2 of Services («Envíos a todo el país») **and** the
of the banner 002. Use `{ exact: true }` when two headings share a
trozo.

## State

### Client catalogue fetches cannot use `API_BASE_URL=http://api:8000`

RSC and server actions reach the API on the Compose network. The browser
cannot resolve `api` (and CORS would block `localhost:8000` anyway).
Cart line joins and similar client work must go through a server action
(or stay on `API_MODE=mock`). Symptom: badge count rises after Agregar,
drawer / `/carrito` stay empty.

### Signed-in cart must re-fetch `/me` on focus

An already-open storefront tab keeps Zustand `serverReady` and used to
skip `/api/me`. Cart changes from another browser never appeared. Always
GET `/me` when signed in, and re-run hydration on `visibilitychange` /
`focus`. Guest carts stay per-browser localStorage only.

`CartHydration` lives in the locale layout, so it stays mounted across
`/ingresar` → catalog. A mount-only `useEffect` hydrates as guest and
never calls `/api/me` after login. Depend on `usePathname()` so the
effect runs again once `sparks_signed_in` is set (021 AC-8).

Cart mutate / resolve / session hydrate call same-origin route handlers
that forward to `API_BASE_URL` and return `application/json` with the
upstream status. In DevTools filter `cart` or `me` — Preview is real
JSON, not RSC Flight. Guest Agregar still has no network (localStorage).

### `persist` of Zustand writes in each `setState`

A test that did `setState({items: []})` to «simulate a reload» cleared `localStorage` before
rehidratar, and the rehidratación returned empty. To test the rehidratación you need to **sow the storage after**
vaciar el store, not before.

In the application we use `skipHydration: true` and a `rehydrateCart()` in effect: hydrating during
the render would make the header counter rendered on server (always empty) not match
with the client's one.

## PowerShell

Chaining `sh -c "... $(command) ..."` in a `docker run` does not work: PowerShell interpolates `$(...)`
before passing it to the container. Use single quotes, or —better— let the tool resolve
the work (for example `npm install --package-lock-only`, which also avoids inventing versions by hand).

Also, PowerShell treats the output by stderr of `docker compose` as error when using `2>&1 |`,
so a `$LASTEXITCODE`/`Exit code` different from 0 in those pipelines **does not** mean that the
command failed. Check the real output before concluding anything.
