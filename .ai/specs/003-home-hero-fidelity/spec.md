# 003 · Hero y marquesina de home

- **Estado:** implementado (2026-09-23)
- **Fecha:** 2026-09-23
- **Padre:** [001-storefront-fase-1](../001-storefront-fase-1/spec.md) (T050 hero, T051 marquesina)
- **Fuente:** prototipo
  [`QUUhcHp24QBtXkUG8sHPDj`](https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj)
  + capture del usuario (2026-09-23). El PDF sigue gobernando tokens, táctil y
  contraste (RNF-1/2 de 001).

## Problema

El hero de T050 no calza el prototipo: los contadores viven debajo de las dos
columnas, «Se recuerda» no es oro, el kicker no tiene la raya, el packshot
queda en un recuadro 3:2 con aire, y la marquesina no está pegada a esa
imagen ni se lee como franja blanca de un solo cuerpo.

## Objetivo

Hero + marquesina fieles al prototipo, sin tocar copy de diccionario ni el
resto de la home (familias, destacados, 002).

## Alcance

### Dentro

1. Contadores (referencias / despacho / valoración) **dentro** de la columna
   de copy, justo debajo de los dos CTAs. Valor arriba, label abajo.
2. CTA WhatsApp con el punto success de 8px (sustituto §05 del logo).
3. Kicker con raya no-texto a la izquierda del texto.
4. «Se recuerda.» / «It is remembered.» en `text-accent-gold` (el h1 es ≥40px,
   cumple RNF-2).
5. Imagen derecha a sangre: ocupa toda la columna, del borde del header a la
   marquesina. Caption superpuesta, no debajo. Se abandona el 3:2 de T050.
6. Marquesina `bg-surface-raised`, al ras de la imagen, marcas a un solo
   tamaño fijo, `whitespace-nowrap`.

### Fuera

- Fotografía real (sigue el placeholder §05).
- Cambiar los literales del diccionario (24 h, 100 ml, `{count}+`).
- Club / franja / footer (002).

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como visitante leo el hero del prototipo: raya + h1 con oro + CTAs + stats |
| US-2 | P0 | Como visitante la imagen derecha llena su columna y la marquesina está pegada |

## Requisitos

### RF-1 · Columna de copy

- Kicker: flex, raya `bg-accent-gold` 32×1px (no es texto), luego
  `home.hero.eyebrow`.
- h1: `titleLead` en ink + `titleEm` italic oro. Un solo h1.
- CTAs sin cambio de destino. WhatsApp lleva `WhatsappDot`.
- `dl` de tres stats en la misma columna, `mt` corto (no `mt-16` de página).

### RF-2 · Imagen

`lg:grid-cols-2` **sin** `items-center`. Figure `relative` a altura de fila.
`Packshot` en modo `fill` (sin `aspect-ratio`). Caption absoluta al pie
derecho. Sin borde ni padding bajo el packshot.

### RF-3 · Marquesina

Hermana inmediata del hero (cero gap). Fondo `surface-raised`. Ítems
`text-[11px]` tracking 0.18em, nowrap, mismo `font-sans`. `[data-marquee]`
sigue siendo el gancho de reduced-motion.

## Criterios de aceptación

| ID | Criterio |
|----|----------|
| AC-1 | Stats están en la columna de copy, debajo de los CTAs |
| AC-2 | El CTA WhatsApp muestra el punto verde de 8px |
| AC-3 | El kicker tiene una raya a la izquierda |
| AC-4 | `titleEm` es `text-accent-gold` y el h1 sigue siendo uno |
| AC-5 | A ≥900px la figure llena la columna derecha y su borde inferior toca la marquesina (±2px) |
| AC-6 | Marquesina `bg-surface-raised`; todas las marcas el mismo `11px` |
| AC-7 | Axe / touch / copy-elasticity / reduced-motion de 001 siguen verdes |
