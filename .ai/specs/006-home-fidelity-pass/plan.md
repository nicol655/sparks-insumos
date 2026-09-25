# Plan técnico · 006 Fidelidad home

- **Estado:** propuesto (2026-09-23)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** ninguno. Oro ≥24px ya está en RNF-2 / T106. La marquesina 22px
  **corrige** 003: el proto es Cormorant 22px, no sans 11px. El 11px salió
  de una captura; el JS del artifact manda.

## 1 · Enfoque

Un pase de layout/copy en la home. Sin API nueva. `GoldRule` extrae la raya
34×1 para no copiar `w-8` otra vez.

`Services` se desmonta de `page.tsx`. CommerceStrip (002) es la franja del
proto (`services` en el JS: Envíos / Pagos / Mayorista).

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `web/src/components/primitives/gold-rule.tsx` | `span` 34×1 `bg-accent-gold` |
| `web/src/components/home/hero.tsx` | `GoldRule`; gap de columna |
| `web/src/components/home/brand-marquee.tsx` | 22px display, gap 56 |
| `web/src/components/home/olfactive-families.tsx` | desc, count, hover, min-h, bajada mono |
| `web/src/components/home/featured.tsx` | título + Ver todo |
| `web/src/app/[locale]/page.tsx` | quitar `<Services />` |
| `web/src/components/home/club.tsx` | h2 34→56, `GoldRule` + kicker |
| `web/src/i18n/messages/{es,en}.json` | featured title/viewAll, family descs |
| `web/src/components/home/__tests__/home.test.tsx` | AC-1–AC-6 |
| `web/e2e/home.spec.ts` | marquesina 22px; sin «Asesoramiento real»; Ver todo |

P1 (si entra en el mismo lote):

| Archivo | Cambio |
|---------|--------|
| `web/src/app/[locale]/catalogo/(grid)/page.tsx` | kicker crumb sobre el h1 |

`services.tsx` se borra si no queda ningún import; si el test de home lo
nombra, se actualiza.

## 3 · Marquesina (el diff que se ve)

```
antes  font-sans text-[11px] tracking-[0.18em]  gap-12
ahora  font-display text-[22px] tracking-[0.22em] text-text-muted  gap-14
       (ink/55 del proto es 4.11:1 sobre #FBF9F5; AC-13 manda)
```

Reduced-motion sigue en `[data-marquee]`. El E2E que mide figure↔marquee
no depende del tipo.

## 4 · i18n

```
home.featured.title     Los más pedidos / Most requested
home.featured.viewAll   Ver todo / View all
home.families.desc.ambar-especias | florales | gourmand | maderas
```

`home.featured.note` y `home.services.*` pueden quedar en el diccionario
(muertos) o borrarse. Borrar obliga a paridad; se borran las claves
`home.services.*` si se elimina el componente.

## 5 · Datos / API

Ninguno. El count de familia sale de `facets.families[].count` que la home
ya pide.

## 6 · Trade-offs

| Opción | Se elige | Por qué |
|--------|----------|---------|
| Marquesina 11px (003) | No | El proto es 22px Cormorant; el usuario pidió tamaños |
| Oro 10px como el proto | No | RNF-2 / constitution; 24px o raya |
| Raya 34px vs `w-8` | 34 | Fidelidad del hero kicker |
| Dejar Services + Commerce | No | Services no está en el proto; es un duplicado |
| Hover invertido en familias | Sí | Está en el markup del proto |
| Token nuevo para club h2 | No | clamp en la clase de `club.tsx` (igual que contacto) |
| ADR | No | Corrección de fidelidad |

## 7 · Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Marquesina 22px + 0.22em envuelve / overflow a 360 | Medio | `nowrap` + track `w-max` (ya); copy-elasticity |
| Hover ink en familia: índice oro 24px sobre ink | Bajo | En hover el índice pasa a `text-accent-gold` (4.4:1 sobre ink es peor) o a `text-canvas`. **Canvas en hover.** |
| Quitar Services rompe E2E que busca «Todo el país» | Medio | Ese heading también está en CommerceStrip; usar `{ exact: true }` como en 002 |
| Club h2 56px + kicker 24px envuelve | Bajo | `min-w-0` en la columna |

## 8 · Test

| AC | Dónde |
|----|--------|
| AC-1 | hero: `.bg-accent-gold.h-px` width 34; `Se recuerda.` gold |
| AC-2 | marquee `text-[22px] font-display`; E2E 003 intacto |
| AC-3 | familia: desc + count; hover class `hover:bg-ink` |
| AC-4 | `getByRole('link', {name: Ver todo})` → `/catalogo` |
| AC-5 | `queryByRole('heading', {name: Asesoramiento real})` ausente |
| AC-6 | Club kicker tiene `GoldRule` + `text-accent-gold` |
| AC-7 | `accent-gold.test.ts` |
| AC-8 | PHASE1 `/` |
| AC-9 | messages.test |

Gate Docker + `e2e` (home). Reiniciar `web` si Turbopack no refresca el
`page.tsx`.

## 9 · Fuera de este plan

Ficha, drawer, checkout, T083, `api/`. Catálogo crumb es P1 del mismo spec
si el lote da.
