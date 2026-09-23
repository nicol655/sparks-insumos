# Tasks · 003 Hero y marquesina

- **Estado:** hecho
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)

## User stories

- [x] **T210 · Packshot fill + hero** → RF-1, RF-2, AC-1–AC-4
  `fill` en `packshot.tsx`. Reescribir `hero.tsx`: raya, oro, dot, stats
  bajo CTAs, figure a sangre. Tests en `home.test.tsx`.

- [x] **T211 · Marquesina** → RF-3, AC-6
  `bg-surface-raised`, `text-[11px]`, nowrap. Test de clases.

- [x] **T212 · E2E** → AC-5, AC-7
  `e2e/home.spec.ts`: figure toca la marquesina. Un solo h1.

## Polish

- [x] **T213 · Verify** → AC-7
  Gate Docker + E2E. Reiniciar `web` antes del Playwright.

## Dependencias

`T210 → T211 → T212 → T213`

## Definition of Done

`/verify` verde, E2E verde, `tasks.md` tildado, `progress.md` actualizado.
