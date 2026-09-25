# Tasks · 006 Fidelidad home

- **Estado:** hecho
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)

## Setup

- [x] **T240 · Diccionario** → RF-4, RF-5, AC-4, AC-9
  `home.featured.title` → «Los más pedidos» / «Most requested».
  Sumar `home.featured.viewAll` y `home.families.desc.{slug}` (4 slugs).
  Borrar `home.featured.note` y `home.services.*` (el bloque se va).
  Archivos: `web/src/i18n/messages/{es,en}.json`, `messages.test.ts`.

- [x] **T241 · GoldRule** → RF-1, AC-1, AC-7
  Primitive `span` 34×1 `bg-accent-gold` `aria-hidden`.
  Archivos: `web/src/components/primitives/gold-rule.tsx` + test.

## User stories

- [x] **T242 · Hero + marquesina** → US-1, RF-2, RF-3, AC-1, AC-2
  Hero usa `GoldRule` y `gap-7` en la columna. Marquesina Cormorant 22px,
  tracking 0.22em, `text-text-muted`, gap-14.
  Archivos: `hero.tsx`, `brand-marquee.tsx`, `home.test.tsx`.

- [x] **T243 · Familias + destacados** → US-2, RF-4, RF-5, AC-3, AC-4
  Familias: bajada mono 10px, desc + count, min-h 250, hover ink
  (índice canvas en hover). Destacados: h2 proto + «Ver todo» → `/catalogo`.
  Archivos: `olfactive-families.tsx`, `featured.tsx`, `home.test.tsx`.

- [x] **T244 · Quitar Services + Club** → US-3, RF-6, RF-7, AC-5, AC-6
  Sacar `<Services />` de `page.tsx`; borrar `services.tsx`.
  Club: h2 34→56, `GoldRule` + kicker oro 24px.
  Archivos: `page.tsx`, `club.tsx`.

- [x] **T245 · Catálogo crumb (P1)** → US-4
  Kicker mono sobre el h1: «Catálogo · N {catalog.count}».
  Archivos: `catalogo/(grid)/page.tsx`, `e2e/catalog.spec.ts`.

- [x] **T246 · E2E home** → AC-2, AC-4, AC-5, AC-8
  Marquesina 22px; «Ver todo»; ausente «Asesoramiento real»;
  «Todo el país» `{ exact: true }` sigue en CommerceStrip.
  Archivos: `web/e2e/home.spec.ts`.

## Polish

- [x] **T247 · Verify** → AC-7, AC-8, AC-9
  Gate Docker + E2E home/catalog/a11y. Reiniciado `web` para Turbopack.

## Dependencias

`T240 → T241 → T242 → T243 → T244 → T245 → T246 → T247`

T241 y T240 pueden ir en paralelo `[P]` antes de T242.

## Definition of Done

`/verify` verde, E2E home verde, `tasks.md` tildado, `progress.md` actualizado.
