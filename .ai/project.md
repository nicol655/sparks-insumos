# Project

## What

**Sparks Parfums** — storefront nuevo de **Sparks Insumos** (CUIT 20-95827720-3),
mayorista de insumos de belleza en Buenos Aires (Franklin). La tienda viva es
[sparksinsumos.com](https://sparksinsumos.com/) (Tiendanube): perfume, maquillaje,
skincare y accesorios, piso $30.000, 5/10% por volumen, envío a cargo del
comprador, pago en efectivo o transferencia, más WhatsApp `5491168692694`.

Este repo reemplaza esa Tiendanube. Fase 1 recorta a **perfumería** (árabe, nicho
e inspiraciones) con cierre por WhatsApp — sin pasarela. El modelo completo
(maquillaje, mínimo, descuentos, legales) está en `business-model.md`.

Dirección de diseño: editorial de lujo silencioso. Tinta casi negra sobre hueso cálido, serif
display, líneas de 1px en lugar de sombras, cero radios salvo en chips. Bilingüe es-AR / en.

## Structure

Monorepo por servicios, cada uno autocontenido en Docker (ver `architecture.md`):

- `web/` — storefront Next.js. Fase 1 publicada en local (home, catálogo, ficha,
  carrito, búsqueda). Falta el cupón (T083, reglas sin definir).
- `api/` — backend propio (catálogo, pedidos, autenticación). El esqueleto
  (FastAPI + Postgres en Docker) está en marcha. La autenticación de
  `specs/007-api-autenticacion/` sigue en tareas. El contrato del catálogo
  sigue en `web/src/lib/api/contract.ts`.
- `docker/` — orquestación del stack completo.

## Fuentes de verdad del diseño

- `Tienda perfumes diseño web.pdf` (v1.0 · 2026) — especificación técnica de diseño: tokens,
  tipografía, componentes con estados, grillas, breakpoints, assets, accesibilidad e i18n.
  **Cualquier desvío vuelve a este documento antes de codificarse.**
- Prototipo navegable: `https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj`
  (el PDF lo nombra `Sparks Perfumes.dc.html`).

## Status

Fase 1 del storefront cerrada salvo T083 (cupón). Contacto visual (004) está
publicado. `api/` cierra la autenticación de
`specs/007-api-autenticacion/` (T250–T265): registro, login, logout, `/me`,
cambio obligatorio de clave y Swagger. El frontend no se conecta todavía.
Roles quedan para una spec posterior. Ver `progress.md`.
