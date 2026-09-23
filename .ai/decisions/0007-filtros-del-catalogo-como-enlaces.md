# ADR 0007: Filtros del catálogo como enlaces

- **Status:** accepted
- **Date:** 2026-09-22
- **Deciders:** Nico + agente

## Context

AC-9 exige que aplicar un filtro actualice la URL y que recargarla reproduzca la grilla. El
estado vive en `searchParams` (`family`, `brand`, `size`, `priceMin`, `priceMax`, `q`, `sort`).

En App Router + next-intl 4, `router.replace` sobre el mismo pathname (`/catalogo`) **descarta**
el query string: la barra queda en `/es/catalogo` aunque se pase `?family=gourmand` o
`{ pathname, query }`. Los `onClick` de chips en componentes cliente tampoco hidrataban en el
E2E de Playwright, así que un botón no era una fuente de verdad.

Los `Link` de next-intl **sí** aceptan `{ pathname: "/catalogo", query }` — ya lo hacen las
familias de la home.

## Decision

Cada chip de faceta (y cada chip removible) es un `Link` a `/catalogo` con el query *siguiente*
(`withToggled*`, `without*`). El chip que vaciaría la grilla se renderiza como `<span>` al 40%
(RF-2), no como enlace. El select de orden sigue haciendo `window.location.assign` porque un
`<select>` no puede ser un enlace.

## Alternatives considered

- **`router.replace` / `router.push`** (next/navigation y next-intl): el proxy trata el
  pathname como invariable y tira el search. Descartado.
- **`window.location.assign` en el click**: funciona si hay JS, pero el E2E veía botones
  estáticos. Descartado para chips.
- **Overlay de filtros <900px**: el toggle tampoco hidrataba. La barra se apila sobre la
  grilla por debajo de `xl` (T066: una columna, sticky sólo en ≥1140).

## Consequences

- Aplicar o quitar un filtro es navegación real: funciona sin hidratar y el E2E hace click
  en `link`, no en `button`.
- Una combinación vacía (p. ej. Gourmand + V.V Love) no se alcanza por chips: RF-2 los
  apaga. El estado vacío se prueba con la URL compartida (AC-10).
- El sort todavía recarga la página. Si el prototipo confirma los órdenes, se puede pasar
  a un `<form method="get">` nativo.
