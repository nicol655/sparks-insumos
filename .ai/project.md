# Project

## What

**Sparks Parfums** — storefront nuevo de **Sparks Insumos** (CUIT 20-95827720-3),
mayorista de insumos de belleza en Buenos Aires (Franklin). La tienda viva es
[sparksinsumos.com](https://sparksinsumos.com/) (Tiendanube): perfume, maquillaje,
skincare y accesorios, piso $30.000, 5/10% por volumen, envío a cargo del
comprador, más WhatsApp `5491168692694`.

Este repo reemplaza esa Tiendanube. Fase 1 recorta a **perfumería** (árabe, nicho
e inspiraciones) con cierre por WhatsApp — sin pasarela. El equipo opera esa
tienda desde `backoffice/`. El modelo completo está en `business-model.md`.

Dirección de diseño: editorial de lujo silencioso. Tinta casi negra sobre hueso cálido, serif
display, líneas de 1px en lugar de sombras, cero radios salvo en chips. Bilingüe es-AR / en.

## Structure

Monorepo por servicios, cada uno autocontenido en Docker (ver `architecture.md`):

- `web/` — storefront Next.js. Fase 1 publicada en local (home, catálogo, ficha,
  carrito, búsqueda). El cupón (T083) espera códigos vivos y la regla de
  acumulación; el mecanismo ya está en el modelo.
- `api/` — backend propio (catálogo, pedidos, autenticación). Cuentas
  y sesión están en marcha
  ([007](specs/007-api-autenticacion/spec.md)). Productos, categorías
  y tags también ([013](specs/013-productos/spec.md)). El catálogo de
  la vidriera sigue en fixtures (`web/src/lib/api/contract.ts`).
- `backoffice/` — panel interno Next.js. Contenedor `sparks-backoffice`,
  puerto del host `BACKOFFICE_PORT` (3200). Login contra `POST /auth/login`.
  Sesión en Zustand + `sessionStorage` ([010](specs/010-backoffice/spec.md)).
- `docker/` — orquestación del stack completo.

## Fuentes de verdad del diseño

- `Tienda perfumes diseño web.pdf` (v1.0 · 2026) — especificación técnica de diseño: tokens,
  tipografía, componentes con estados, grillas, breakpoints, assets, accesibilidad e i18n.
  **Cualquier desvío vuelve a este documento antes de codificarse.**
- Prototipo navegable de la vidriera: `https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj`
  (el PDF lo nombra `Sparks Perfumes.dc.html`).
- Backoffice, única fuente: `https://claude.ai/artifact/NtzZJG94zfZrj3LpMvAtS9`
  (leída 2026-09-28). Las filas de ejemplo no son datos. Una pantalla del
  panel que no esté en ese artefacto no se inventa.

## Status

Fase 1 del storefront cerrada salvo T083 (cupón: faltan códigos vivos y si
se acumula). `api/` tiene la autenticación de 007. El storefront ya inicia
sesión (008). El backoffice inicia sesión y muestra el cascarón, el
resumen y los ajustes en texto fijo (011). El catálogo del panel
lista y crea productos (014). Los roles del diseño
todavía no están implementados. Ver `progress.md`.
