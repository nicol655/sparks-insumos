# 005 · Página de carrito (fidelidad)

- **Estado:** implementado (2026-09-23)
- **Fecha:** 2026-09-23
- **Padre:** [001-storefront-fase-1](../001-storefront-fase-1/spec.md) (T082 página)
- **Fuente de diseño (única):** prototipo
  [`QUUhcHp24QBtXkUG8sHPDj`](https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj)
  (HTML embebido leído el 2026-09-23). El PDF sigue gobernando tokens, táctil
  y contraste (RNF-1/2 de 001). Copy y layout salen del JS del prototipo, no
  del OCR ni de sparksinsumos.com.

## Problema

`/carrito` ya funciona (persistencia, stepper, ✕, WhatsApp), pero no se parece
al prototipo: el vacío es un texto suelto, el aside es sólo un subtotal, no
hay nota de mínimo ni envío a cotizar, el packshot y el «c/u» no están, y el
CTA dice «Pedir por WhatsApp» en vez de «Finalizar compra».

## Objetivo

Dejar `/es/carrito` · `/en/cart` **fieles al prototipo**. El store, el
repositorio y el cierre por WhatsApp no cambian. El drawer (T080) no se
rediseña.

## Alcance

### Dentro

1. Shell de página: `max-width: 1280px`, padding
   `clamp(34→56) / gutter / clamp(60→100)`, h1 proto.
2. Vacío: caja centrada con borde hairline, itálica 28px, CTA primario al
   catálogo.
3. Filas: grilla proto, packshot 74px 3/3.6, marca · tamaño, nombre, precio
   unitario + «c/u», stepper, total de línea, ✕.
4. Aside 380px (desde 900): kicker Resumen, filas Subtotal / Envío, cupón
   visual, Total 34px, CTA, nota de mínimo.
5. Diccionario es / en con la copy del proto (títulos, vacío, c/u, nota).
6. Piso de **$30.000**: debajo no se arma el `wa.me` (constitution §8).

### Fuera

- Rediseñar el drawer (420px). Sigue usando el resumen compacto.
- Página `/checkout` del proto (formulario, pasos, «Confirmar y pagar»).
- Aplicar cupones (T083 sigue bloqueada). El campo se ve; Aplicar no descuenta.
- Descuento automático 5% / 10% por monto (constitution §9; otra spec).
- «Hasta 3 cuotas» / tarjeta (constitution §11).
- Envío gratis o precio de envío inventado (constitution §10 → «A cotizar»).
- Cambiar el store, `resolveCart` o el contrato.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como comprador veo el carrito del prototipo: filas + aside Resumen |
| US-2 | P0 | Como comprador con carrito vacío veo la caja y un CTA al catálogo |
| US-3 | P0 | Como comprador por debajo de $30.000 no puedo cerrar el pedido por WhatsApp |

## Requisitos

### RF-1 · Shell

`main` centrado, `max-w-[1280px]`, padding del proto. h1
`clamp(32px, 4.2vw, 52px)` (`text-h1-page` si el test de escala lo prefiere;
el proto es 32→52). Título: `Tu carrito` / `Your cart`. Un solo h1.

Dos columnas desde 900 (`minmax(0,1fr) 380px`), gap `clamp(28→54)`. Una
columna debajo.

### RF-2 · Vacío

Caja `border` hairline, padding 70px, flex col centrada, gap 18:

- `cart.empty`: *Todavía no agregaste nada.* / *Nothing here yet.* Cormorant
  28px italic `#8A8073`.
- CTA primario (`ButtonPrimary` o mismas clases): `cart.browse` → `/catalogo`.

Sin bajada «El catálogo está a un clic.»

### RF-3 · Filas (con ítems)

Encabezado mono 9.5px sólo **≥900**: Producto · Cantidad (centro) · Total
(derecha) · hueco de la ✕. Borde inferior ink.

Cada línea, padding 22px 0, borde hairline:

| Pieza | Proto |
|-------|--------|
| Packshot | 74px, `aspect-ratio: 3 / 3.6`, placeholder diagonal |
| Identidad | marca · tamaño 9.5px meta; nombre display 20px enlace a la ficha; `{precio} c/u` 12.5px meta |
| Stepper | el `QuantityStepper` ya existente (borde, − / qty / +). Mínimo 1; quitar es la ✕ |
| Total | 16px, alineado a la derecha desde 700 |
| Quitar | × 15px meta, 44×44 táctil |

Grilla: `<700` `minmax(0,1fr) auto`; `≥700` `2.4fr 1fr 1fr 0.4fr`.

Líneas `unavailable` se quedan (no están en el proto; no se pierden).

### RF-4 · Aside Resumen

Sólo en la **página**. Caja `bg-surface-raised` (`#FBF9F5`), borde hairline,
padding 30px, flex col gap 18:

1. Kicker `Resumen` / `Summary` — mono 10px meta. No es oro (RNF-2).
2. Filas 13.5px / 300: **Subtotal** + monto; **Envío** + `A cotizar` /
   `Quoted`.
3. Fila cupón: `BoxedInput` (placeholder Cupón / Coupon) + botón Aplicar.
   `onSubmit` / click → `preventDefault`. Sin toast, sin descuento, sin
   `couponOk` / VIP15.
4. Total: label 11px uppercase + monto display **34px**. El total **es el
   subtotal** (el envío no se inventa).
5. CTA ink full-width: `Finalizar compra` / `Checkout`. Si
   `subtotal ≥ 30000` → `wa.me` con el pedido (T084). Si no → control
   deshabilitado, **sin** href.
6. Nota 11.5px / 300 / muted:
   `Mínimo de compra $30.000. El envío se cotiza según tamaño y peso.` /
   `Minimum order $30,000. Shipping quoted by size and weight.`

### RF-5 · Copy (prototipo)

| Clave | es | en |
|-------|----|----|
| title | Tu carrito | Your cart |
| empty | Todavía no agregaste nada. | Nothing here yet. |
| browse | Ver catálogo | View catalogue |
| each | c/u | each |
| product | Producto | Product |
| quantity | Cantidad | Quantity |
| price (th) | Total | Total |
| summary | Resumen | Summary |
| couponPh | Cupón | Coupon |
| apply | Aplicar | Apply |
| shipping | Envío | Shipping |
| shippingQuote | A cotizar | Quoted |
| total | Total | Total |
| checkout | Finalizar compra | Checkout |
| note | Mínimo de compra $30.000. El envío se cotiza según tamaño y peso. | Minimum order $30,000. Shipping quoted by size and weight. |

`subtotal` ya es idéntico en ambos idiomas.

### RF-6 · Compartido

El drawer **no** monta este aside. `CartSummary` compacto (subtotal + Ver
carrito + CTA) se queda para T080. El CTA del drawer puede seguir diciendo
`Pedir por WhatsApp` o reutilizar `checkout`; no es parte de esta spec.

## Criterios de aceptación

| ID | Criterio |
|----|----------|
| AC-1 | Un `h1` «Tu carrito» / «Your cart». Shell 1280 / padding proto |
| AC-2 | Vacío: caja + itálica proto + CTA primario a `/catalogo`. Sin hint |
| AC-3 | Con ítems: packshot 74px, «c/u», encabezados ≥900, grilla proto |
| AC-4 | Aside muestra Resumen, Subtotal, Envío a cotizar, Total = subtotal, nota $30.000 |
| AC-5 | Cupón + Aplicar visibles; Aplicar no cambia el total ni llama red |
| AC-6 | `subtotal ≥ 30000` → CTA es `wa.me/5491168692694` con el pedido |
| AC-7 | `subtotal < 30000` → no hay enlace `wa.me` de pedido en la página |
| AC-8 | Drawer intacto: 420px, foco, Escape, resumen compacto |
| AC-9 | Axe / touch / un h1 / copy-elasticity verdes en `/carrito` |
| AC-10 | Cero literales en componentes. Paridad es/en |

## Preguntas abiertas

Ninguna bloquea el visual. El proto también tiene `/checkout` y códigos de
cupón (`couponOk` −10%, VIP −15%): fuera de alcance hasta T083 y la spec de
checkout. El CTA se ve como «Finalizar compra» y **cierra por WhatsApp**,
igual que T084; no se implementa pasarela.
