# Tasks · 005 Carrito (fidelidad)

- **Estado:** hecho
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)

## Setup

- [x] **T230 · Diccionario** → RF-5, AC-10
  Actualizar `cart.title` / `empty`; sumar `each`, `summary`, `couponPh`,
  `apply`, `shipping`, `shippingQuote`, `total`, `note`, `placeOrder`.
  `cart.price` → «Total» (allowlist). Drawer sigue en `cart.checkout`.
  Archivos: `web/src/i18n/messages/*.json`, `messages.test.ts`.

- [x] **T231 · Piso de compra** → RF-4, US-3, AC-6, AC-7
  `CART_MIN_SUBTOTAL = 30_000` + test.
  Archivos: `web/src/lib/cart/min-order.ts` + test.

## User stories

- [x] **T232 · Aside Resumen** → US-1, US-3, RF-4, AC-4–AC-7
  `cart-aside.tsx`: kicker, Subtotal / Envío, cupón no-op, Total 34px,
  CTA gated, nota. Sin `fetch`.
  Archivos: `cart-aside.tsx` + `cart-aside.test.tsx`.

- [x] **T233 · Filas y vacío** → US-1, US-2, RF-2, RF-3, AC-2, AC-3
  `cart-line.tsx` (página): packshot 74px 3/3.6, `c/u`. `cart-view.tsx`:
  caja vacía + grilla proto. Drawer sin cambio visual.
  Archivos: `cart-line.tsx`, `cart-view.tsx` + tests.

- [x] **T234 · Shell de página** → RF-1, AC-1
  `carrito/page.tsx`: max 1280, padding proto, h1 `text-h1-page`.
  Archivos: `web/src/app/[locale]/carrito/page.tsx`.

- [x] **T235 · E2E** → AC-1, AC-2, AC-5–AC-8
  Vacío, aside, cupón no navega, CTA gated, drawer intacto.
  Archivos: `web/e2e/cart.spec.ts`.

## Polish

- [x] **T236 · Verify** → AC-8, AC-9, AC-10
  Gate Docker + E2E. Reiniciar `web` si Turbopack no levanta el aside.

## Dependencias

`T230 → T231 → T232 → T233 → T234 → T235 → T236`

## Definition of Done

`/verify` verde, E2E verde, `tasks.md` tildado, `progress.md` actualizado.
