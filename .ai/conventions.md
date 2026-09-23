# Conventions

Project-specific conventions. These extend `.cursor/rules/20-engineering.mdc`
and win where they conflict.

## Structure

```
web/src/
├── app/[locale]/          # pages + layout (the root layout lives here)
├── components/
│   ├── primitives/        # §03: buttons, inputs, chip, badge, accordion, toast
│   ├── layout/            # header, footer, menu, FAB, skip-link, toasts
│   ├── home/              # hero, marquee, families, featured, services, club, commerce-strip
│   ├── catalog/           # card, grid, facets, sort, empty/error
│   ├── product/           # gallery, pyramid, specs, accordion, purchase
│   ├── cart/              # drawer, view, line, summary
│   ├── search/            # trigger, overlay, live results
│   ├── contact/           # page + visual-only form (004)
│   └── icons/             # stroke SVGs from §05
├── lib/
│   ├── api/               # Zod contract + CatalogRepository
│   ├── cart/              # persist store + resolveCart
│   ├── catalog/           # URL query helpers
│   ├── ui/                # overlay store, focus trap, scroll lock
│   ├── seo.ts             # hreflang / OG metadata
│   ├── env.ts             # Zod env
│   └── whatsapp.ts        # wa.me builder
├── i18n/                  # routing, request, messages/{es,en}.json
├── fixtures/              # mock catalog (repository only)
├── styles/                # theme.css, animations, versioned fonts
└── e2e/                   # Playwright (sibling of src: web/e2e/)
```

- Tests live next to the code: `foo.tsx` → `__tests__/foo.test.tsx`.
- The catalog listing is `catalogo/(grid)/` so its `loading.tsx` does not wrap the product page.
- `docker/` only orchestrates. Each service owns its Dockerfile.

## Naming

- Files: kebab-case (`cart-drawer.tsx`, `olfactive-pyramid.tsx`).
- Components: PascalCase named export matching the file (`export function CartDrawer`).
- Routes in source stay in Spanish (`catalogo`, `carrito`); English pathnames live in `i18n/routing.ts`.
- Task IDs (`T082`) appear in a one-line file comment when they explain *why* the file exists.

## Patterns to follow

- UI talks to `CatalogRepository`. Never `fetch` and never import `src/fixtures` from a component.
- Catalog filter / sort changes go through a real URL: native `<a href>` via `catalogUrl`, or `location.assign` on a `<select>`. See ADR-0007.
- One overlay slot (`useUiStore`). Opening search closes cart, and so on.
- Overlays reuse `useFocusTrap` / `useScrollLock` from `lib/ui/overlay.ts`.
- Visible copy comes from `next-intl`. `no-literal-string` is an error on `src/components/**` and `src/app/**`.
- Client islands only where the browser must act (cart, search, gallery, steppers). Pages stay RSC.
- Per-route SEO goes through `seoMetadata()` (`web/src/lib/seo.ts`). Layout owns `metadataBase` and icons.
- Interactive controls get `min-h-11` (44px) so AC-15 holds at 360px. Underlined text links need `inline-flex items-center` or they shrink to the glyph.
- `text-accent-gold` only on type ≥24px or on non-text (RNF-2). `accent-gold.test.ts` enforces it.

## Anti-patterns to avoid

- `metadata.title.template` interpolated with next-intl `{page}`. Next requires `%s`; anything else throws in `generateMetadata` and the page renders as `__next_error__`.
- `router.replace` / `router.push` to write catalog query strings — the proxy drops the search (ADR-0007).
- `useSearchParams()` in the `[locale]` chrome — it poisons prerender of every page.
- `text-success` or `text-canvas/40` on 10px type — axe color-contrast fails.
- Gallery thumbs without `block w-full` — a shrink-wrapped placeholder measures 2×2.
- Inventing Instagram, legal, or other URLs that are not in the spec (open questions).

## Testing conventions

- Unit / component: Vitest + Testing Library + `axe-core` (`web/src/test/a11y.ts`). Colocated.
- E2E: Playwright in the `e2e` compose service, four viewports (360 / 900 / 1140 / 1440).
- Fase 8 gates (axe, touch, copy overflow, one `h1`, reduced-motion) run on **mobile-360 only**. i18n runs on every viewport.
- Skip `.sr-only` (the skip-link) in touch and overflow measurements — it is clipped to 1×1 by design.
- After adding a client island to the layout, `docker compose -f docker/docker-compose.yml restart web` and wait for `healthy` before E2E. Turbopack does not always rebuild the layout on a bind-mounted file.
- Quality gate: `.cursor/verify.json` → `docker compose … run --rm --no-deps web npm run verify`. Node is not required on the host.

## Commit / branch conventions

- Small commits that say *why*. No secrets (`.env` is gitignored).
- Do not invent versions by hand; install inside the `web` image so the lockfile stays authoritative.
- The repo still has no first commit on `master` — do not create one unless asked.
