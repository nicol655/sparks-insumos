# Plan técnico · 003 Hero y marquesina

- **Estado:** implementado (2026-09-23)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** ninguno. `Packshot` gana un `fill` opcional; las tarjetas no cambian.

## 1 · Enfoque

Un diff de layout en `hero.tsx` + `fill` en `packshot.tsx` + clases en
`brand-marquee.tsx`. Sin i18n nueva.

El 3:2 de T050 se reemplaza a propósito: el prototipo pinta la columna
entera. El placeholder diagonal sigue siendo el único arte.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `web/src/components/home/hero.tsx` | Grilla a sangre, stats, raya, oro, dot |
| `web/src/components/catalog/packshot.tsx` | Prop `fill` |
| `web/src/components/home/brand-marquee.tsx` | `bg-surface-raised`, 11px, nowrap |
| `web/src/components/home/__tests__/home.test.tsx` | AC-1–AC-4, AC-6 |
| `web/e2e/home.spec.ts` | AC-5: figure pega a la marquesina |

## 3 · Riesgos

- `text-accent-gold` tiene que convivir con `text-h1-hero` **en la misma
  línea** (`accent-gold.test.ts`).
- Stats a 3 columnas en 360px: labels que envuelven, no overflow.
- `fill` no debe alterar cards / galería / carrito.
