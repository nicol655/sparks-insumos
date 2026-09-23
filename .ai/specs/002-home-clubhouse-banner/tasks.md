# Tasks · 002 Pie de home

- **Estado:** hecho
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)

## Setup

- [x] **T200 · Rutas y diccionarios** → RF-1, RF-2, RF-3, AC-7
  `/registro` y `/cuenta` en `routing.ts`. Copy de club, franja y footer en
  `messages/{es,en}.json`. Allowlist de kicker / redes / copyright.
  Archivos: `web/src/i18n/routing.ts`, `web/src/i18n/messages/*.json`,
  `web/src/i18n/__tests__/messages.test.ts`.

## User stories

- [x] **T201 · Club** → US-1, AC-2
  Reescribir `club.tsx`. Tests: h2, 4 beneficios, CTAs, sin WhatsApp, axe.
  Archivos: `web/src/components/home/club.tsx`, `home.test.tsx`.

- [x] **T202 · Franja comercial** → US-2, AC-1, AC-3
  `commerce-strip.tsx` + montaje en `page.tsx` después de `<Club />`.
  Archivos: `web/src/components/home/commerce-strip.tsx`,
  `web/src/app/[locale]/page.tsx`, `home.test.tsx`.

- [x] **T203 · Footer y FAB** → US-3, AC-4, AC-5, AC-6
  Footer del prototipo. FAB con `border-canvas/20`. Wordmark 28px sin subline.
  Archivos: `footer.tsx`, `wordmark.tsx`, `whatsapp-fab.tsx` + tests.

- [x] **T204 · E2E home** → AC-1–AC-6, AC-9
  `e2e/home.spec.ts`: club, franja, footer, un h1.

## Polish

- [x] **T205 · Verify** → AC-7, AC-8, AC-9
  `npm run verify` en Docker + E2E. Reiniciar `web` antes del Playwright.

## Dependencias

`T200 → T201, T202, T203 → T204 → T205`

## Definition of Done

`/verify` verde, E2E verde, `tasks.md` tildado, `progress.md` actualizado.
