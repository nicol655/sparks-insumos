# 006 · Repaso de fidelidad (home primero)

- **Estado:** hecho (2026-09-23)
- **Fecha:** 2026-09-23
- **Padre:** [001-storefront-fase-1](../001-storefront-fase-1/spec.md)
  (home T050–T055 + 002 + 003)
- **Fuente de diseño (única):** prototipo
  [`QUUhcHp24QBtXkUG8sHPDj`](https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj)
  (HTML embebido releído el 2026-09-23). El PDF sigue gobernando tokens,
  táctil y contraste (RNF-1/2). Oro en texto **menor a 24px está prohibido**
  (RNF-2 / `accent-gold.test.ts`): se sube a 24px o se sustituye por una
  **raya oro no-texto**.

## Problema

002 y 003 acercaron hero, club y footer. El proto entero de home todavía
difiere en lo que da el tono editorial: tamaños (sobre todo la marquesina),
kickers oro, la raya que abre el hero, tarjetas de familia incompletas, el
bloque Destacados, y una sección `Services` que **el proto no tiene**.

## Objetivo

Home = proto. Donde el proto pinta oro a 10px, acá oro ≥24px o raya 34×1px
+ label. No se toca el store, el carrito (005) ni contacto (004).

## Alcance

### Dentro (P0 · home)

1. **Raya oro del hero:** 34×1px (hoy `w-8` = 32). Misma pieza reutilizable
   en kickers que el proto marca en oro.
2. **Marquesina:** Cormorant **22px**, tracking 0.22em, `ink/55`, gap 56px.
   Hoy es sans 11px (003). El proto es display, no meta.
3. **Familias:** bajada mono 10px uppercase; tarjeta min-h 250, padding proto,
   **desc** + **conteo**; hover ink invertido. Índice oro se queda a 24px.
4. **Destacados:** título proto «Los más pedidos» / «Most requested»; a la
   derecha enlace «Ver todo» → `/catalogo`. Se quita la nota suelta.
5. **Quitar `Services` (T054)** de la home. El proto no la tiene. La franja
   de 3 celdas **después del Club** ya es `CommerceStrip` (Envíos / Pagos /
   Mayorista) con kicker oro.
6. **Club:** h2 al clamp proto 34→56 (hoy `text-h2` 30→46). Kicker oro 24px
   + raya 34×1px a la izquierda (el proto lo pinta oro a 10px; la raya
   recupera el gesto que el usuario pidió).

### Dentro (P1 · resto, sólo lo que se ve mal)

7. **Catálogo:** kicker mono sobre el h1 (crumb «Catálogo · N perfumes»).
   «Limpiar» del proto es oro 10px → raya o ink, no `text-accent-gold` chico.
8. Kickers de **commerce-strip** y **footer:** ya son oro 24px. No bajarlos.

### Fuera

- Foto real, `/checkout`, login, sets, T083.
- Redibujar drawer, ficha o contacto (004/005).
- Implementar 3 cuotas / envío gratis (constitution §10–11). La copy de
  commerce ya está; no se «arregla» hacia tarjeta.
- Familia proto `fresco` (no está en el catálogo Fase 1).
- Pintar oro a 10px. RNF-2 no se relaja.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como visitante la home se lee como el proto: raya, oro, tamaños |
| US-2 | P0 | Como visitante las familias y destacados son las del proto |
| US-3 | P0 | Como visitante no veo un bloque de servicios extra entre destacados y club |
| US-4 | P1 | Como visitante el catálogo abre con el kicker/crumb del proto |

## Requisitos

### RF-1 · Oro y rayas (sistema)

| Sitio | Proto | Acá |
|-------|--------|-----|
| Hero kicker | raya 34×1 oro + 10px meta | raya **34×1** + `text-eyebrow` (ya) |
| Hero «Se recuerda.» | italic oro, h1 40→104 | sin cambio (`text-h1-hero` + `text-accent-gold`) |
| Índice familia / club 01–04 | oro 10px | oro **10px** (ADR-0009) |
| Club / commerce / footer kickers | oro 10px | oro **10px** (ADR-0009) |
| Marquesina | 22px Cormorant, no oro | 22px Cormorant, `text-text-muted` |

Componente mínimo `GoldRule` (`h-px w-[34px] bg-accent-gold`, `aria-hidden`)
para no volver a inventar 32px.

### RF-2 · Hero (ajuste fino)

Columna: `gap-7` (~28–30) en vez de `mt-6/8/10` sueltos. Stats valor
`text-[30px]` display (el proto es 30px fijos; `text-h3` 24→32 vale si el
test de escala lo prefiere). Caption itálica 15px abajo (el proto la pone
abajo al centro; 003 la dejó a la derecha — se deja).

### RF-3 · Marquesina

`font-display text-[22px] tracking-[0.22em] uppercase text-text-muted`, gap
`56px` (`gap-14`), padding `py-5` se queda. `data-marquee` y reduced-motion
no se tocan. E2E 003 (figure pega a marquesina) sigue válido.

### RF-4 · Familias

- `home.families.note` se muestra como mono 10px uppercase tracking 0.16em
  (no `text-body-m`).
- Claves nuevas `home.families.desc.{slug}` (copy proto):

  | slug | es | en |
  |------|----|----|
  | ambar-especias | Cálidos, dulces, de larga duración. | Warm, sweet, long-lasting. |
  | florales | Rosa, jazmín, azahar. Luminosos. | Rose, jasmine, blossom. Luminous. |
  | gourmand | Vainilla, café, pistacho, praliné. | Vanilla, coffee, pistachio, praline. |
  | maderas | Sándalo, cedro, oud. Elegantes. | Sandalwood, cedar, oud. Elegant. |

- Conteo: `{count} {catalog.count}` del facet.
- Tile `min-h-[250px]`, pad `34/26/28`, hover `bg-ink text-canvas`.
- Índice oro 24px se mantiene (no 10px).

### RF-5 · Destacados

- `home.featured.title` → «Los más pedidos» / «Most requested».
- `home.featured.viewAll` → «Ver todo» / «View all» enlace a `/catalogo`.
- Se deja de renderizar `home.featured.note`.

### RF-6 · Orden de la home

`Hero → Marquee → Families → Featured → Club → CommerceStrip`.
**Sin `Services`.** El archivo `services.tsx` se puede quedar huérfano o
borrarse si nada lo importa.

### RF-7 · Club

h2: `text-[clamp(2.125rem,4.4vw,3.5rem)]` (34→56) o token nuevo sólo si
hace falta. Kicker: `GoldRule` + «Sparks Club» oro 24px.

## Criterios de aceptación

| ID | Criterio |
|----|----------|
| AC-1 | Hero: raya 34×1px; «Se recuerda.» sigue oro |
| AC-2 | Marquesina: ítems `font-display text-[22px]`; E2E 003 no se rompe |
| AC-3 | Familia: desc + count visibles; hover ink; min-h 250 |
| AC-4 | Destacados: h2 proto + enlace Ver todo a `/catalogo` |
| AC-5 | Home **sin** el bloque T054 (Asesoramiento / Cambios simples) |
| AC-6 | Club h2 ≥34px en desktop; kicker con raya + oro 24px |
| AC-7 | Cero `text-accent-gold` menor a 24px (`accent-gold.test.ts`) |
| AC-8 | Axe / un h1 / copy-elasticity en `/` verdes |
| AC-9 | Paridad es/en; cero literales |

## Preguntas abiertas

Ninguna bloquea. «Hasta 3 cuotas» en commerce-strip es copy del proto ya
publicada; no se implementa pago (constitution §11).
