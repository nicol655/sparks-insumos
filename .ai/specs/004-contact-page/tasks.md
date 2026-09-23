# Tasks · 004 Contacto (visual)

- **Estado:** hecho
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)

## Setup

- [x] **T220 · Diccionario** → RF-2, AC-7
  `contact.*` en `messages/{es,en}.json` (kicker, title, body, campos,
  placeholders, aside, panel). Allowlist si el lint de paridad lo pide.
  Archivos: `web/src/i18n/messages/*.json`, `messages.test.ts`.

## User stories

- [x] **T221 · Formulario** → US-1, RF-3, AC-2
  Isla `contact-form.tsx`: 4 `TextInput` + `BoxedTextArea` + primario.
  `onSubmit` → `preventDefault`. Sin `fetch` ni toast.
  Archivos: `web/src/components/contact/contact-form.tsx` + test.

- [x] **T222 · Página y aside** → US-1, US-2, RF-1, RF-4, RF-5, AC-1, AC-3, AC-4
  `contact-page.tsx` + `app/[locale]/contacto/page.tsx` con `seoMetadata()`.
  Kicker oro ≥24px. Panel ink = `wa.me`.
  Archivos: `contact-page.tsx`, `contacto/page.tsx`, `contact-page.test.tsx`.

- [x] **T223 · E2E** → US-3, AC-5, AC-6
  `e2e/contact.spec.ts` + `/es/contacto` · `/en/contact` en `PHASE1_ROUTES`.
  Click «Contacto» en el header; submit no navega.

## Polish

- [x] **T224 · Verify** → AC-6, AC-7
  Gate Docker + E2E. Reiniciar `web` si la ruta nueva no aparece.

## Dependencias

`T220 → T221 → T222 → T223 → T224`

## Definition of Done

`/verify` verde, E2E verde, `tasks.md` tildado, `progress.md` actualizado.
