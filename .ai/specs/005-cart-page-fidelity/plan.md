# Plan técnico · 005 Carrito (fidelidad)

- **Estado:** implementado (2026-09-23)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** ninguno. Reusa T082 (página), T084 (`wa.me`), ADR-0003 (sin
  repositorio nuevo) y `BoxedInput` del §03. El piso $30.000 ya está en
  constitution §8.

## 1 · Enfoque

Diff de **layout y copy** en la página `/carrito`. El store no se toca. El
aside del proto es lo bastante distinto del resumen del drawer como para
**no** reciclar `CartSummary` en la página: un `cart-aside.tsx` nuevo deja
T080 quieto (AC-8).

El CTA del proto navega a `isCheckout`. Acá no: constitution §8/11 y T084.
Se ve «Finalizar compra» y, si el subtotal alcanza el piso, el href es el
`wa.me` que ya arma `buildOrderMessage`.

El cupón se pinta (RF-4) y no aplica (T083). Mismo patrón que el form de
004: `preventDefault`, cero `fetch`.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `web/src/app/[locale]/carrito/page.tsx` | Shell proto (max 1280, padding). El h1 puede quedarse acá o bajar a `CartView` |
| `web/src/components/cart/cart-view.tsx` | Vacío caja + grilla `lg:grid-cols-[minmax(0,1fr)_380px]`. Encabezados `lg:` |
| `web/src/components/cart/cart-line.tsx` | Página: packshot 74px 3/3.6, `c/u`, total 16px. Drawer sin cambio visual |
| `web/src/components/cart/cart-aside.tsx` | Aside proto (nuevo). Cupón no-op. CTA gated a 30_000 |
| `web/src/lib/cart/min-order.ts` | `CART_MIN_SUBTOTAL = 30_000` (un número, constitution §8) |
| `web/src/i18n/messages/{es,en}.json` | `cart.title/empty/each/summary/apply/shipping/shippingQuote/total/note/checkout` |
| `web/src/i18n/__tests__/messages.test.ts` | Allowlist: `cart.total` (idéntico), `cart.subtotal` ya está |
| `web/src/components/cart/__tests__/cart-view.test.tsx` | AC-1–AC-3, vacío |
| `web/src/components/cart/__tests__/cart-aside.test.tsx` | AC-4–AC-7, axe |
| `web/src/components/cart/__tests__/cart-summary.test.tsx` | Sin cambio de contrato; el drawer sigue usando `CartSummary` |
| `web/e2e/cart.spec.ts` | Vacío, aside, CTA gated, submit cupón no navega |

`cart-summary.tsx` y `cart-drawer.tsx` no se redibujan. `QuantityStepper` se
reusa (ya es el control §03).

## 3 · Layout (del HTML del prototipo)

```
main  max-w 1280  mx-auto
      pad clamp(34→56) gutter clamp(60→100)
  h1  font-display  clamp(32→52)  mb-34
  empty
    box border hairline  pad 70  flex col center gap-18
    italic 28  text-text-meta
    ButtonPrimary → /catalogo
  filled  grid  colsAside (1 col <900; 1fr 380 ≥900)  gap clamp(28→54)
    left
      header  lg only  colsCartRow  mono 9.5  border-b ink
      rows    md: 2.4fr 1fr 1fr 0.4fr   <md: 1fr auto
              pack 74× (3/3.6) + id + stepper + total + ✕
    aside   border hairline  bg-surface-raised  pad 30  gap 18
      kicker Resumen
      Subtotal / Envío A cotizar
      BoxedInput + Aplicar
      Total 34px = subtotal
      CTA Finalizar compra
      note $30.000
```

`h1` del proto es el mismo clamp que `text-h1-page` (32→52). Usar el token.

## 4 · i18n

Namespace `cart` (ya existe). Se **reemplazan** `title` y `empty`; se
**agregan** `each`, `summary`, `couponPh`, `apply`, `shipping`,
`shippingQuote`, `total`, `note`. `checkout` pasa de «Pedir por WhatsApp» a
«Finalizar compra» **sólo si** el drawer no lo lee — el drawer usa
`cart.checkout` hoy.

Para no cambiar el drawer (AC-8):

- Página / aside: `cart.checkout` = «Finalizar compra» / «Checkout».
- Drawer: nueva clave `cart.checkoutWhatsapp` = el texto actual, **o** el
  drawer sigue usando `checkout` y el label del proto queda sólo en la
  página (`cart.placeOrder`).

Se elige **`cart.placeOrder`** en el aside («Finalizar compra») y se deja
`cart.checkout` para el drawer. Cero cambio de copy en T080.

`cart.price` (encabezado) pasa a «Total» en ambos idiomas — allowlist.

## 5 · Datos / API

Ninguno. `resolveCart` sigue devolviendo `subtotal`. El aside compara con
`CART_MIN_SUBTOTAL`. No hay campo de envío ni de cupón en el store.

`BoxedInput` ya existe para este campo. El botón Aplicar es
`ButtonPrimary compact` o ink 11/16 del proto; táctil `min-h-11`.

## 6 · Trade-offs

| Opción | Se elige | Por qué |
|--------|----------|---------|
| Aside nuevo vs. inflar `CartSummary` | Aside nuevo | AC-8: el drawer no hereda la caja 380px |
| CTA → `/checkout` | No | Fuera de alcance; constitution §11 |
| CTA label proto + `wa.me` | Sí | T084 + fidelidad visual |
| Aplicar cupón de verdad | No | T083 bloqueada; constitution §9 |
| Pintar 5%/10% por monto | No | Comportamiento nuevo; otra spec |
| Envío «Gratis» del proto badge | No | constitution §10; el proto del carrito ya dice «A cotizar» |
| Piso $50.000 (Quiénes Somos) | No | constitution §8: rige $30.000 |
| Encabezados desde 700 | No | Proto los pinta con `isDesk` (900) |
| ADR | No | No hay decisión no obvia |

## 7 · Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Comprador cree que «Finalizar» cobra | Medio | El href es WhatsApp; la nota lo dice. Sin toast de «pedido enviado» |
| Comprador cree que Aplicar descontó | Medio | Sin mensaje de éxito (el proto sí lo tiene; mentiría) |
| Packshot 3/3.6 vs cards 1:1 | Bajo | Sólo `layout="page"`; `fill` de 003 no se toca |
| CTA deshabilitado < $30k falla axe | Medio | `disabled` nativo + nota; no es un link vacío |
| `cart.price` = «Total» en es y en | Cosmético | Allowlist |
| Padding 70px del vacío a 360 | Bajo | La caja puede bajar padding con `px-gutter py-16` si copy-elasticity falla |

## 8 · Test

| AC | Dónde |
|----|--------|
| AC-1 | `cart-view.test.tsx` + E2E h1 |
| AC-2 | Vacío: caja, itálica, `getByRole('link'|'button', {name: Ver catálogo})` |
| AC-3 | Fila: `c/u`, packshot width, heading Total |
| AC-4 | Aside: Resumen, A cotizar, nota $30.000, Total = subtotal |
| AC-5 | Spy `fetch` + total igual después de Aplicar |
| AC-6 | Carrito ≥ $30.000 → `wa.me/5491168692694` |
| AC-7 | Carrito de una unidad barata (< 30k) → no hay `wa.me` de pedido |
| AC-8 | `cart-drawer.test.tsx` / `cart-summary.test.tsx` sin cambios de aserción |
| AC-9 | `PHASE1_ROUTES` ya incluye `/carrito`; axe del aside |
| AC-10 | lint + paridad |

Un fixture King a $39.000 cubre AC-6; una línea de un producto < $30.000
cubre AC-7 (hay SKUs más baratos en fixtures; si no, dos aserciones con
`subtotal` mockeado en el aside).

Gate: `docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run verify`
y `… run --rm e2e`.

## 9 · Fuera de este plan

`/checkout`, T083, descuentos por tramo, drawer visual, y el resto de
Fase 2 (login, registro, cuenta, sets).
