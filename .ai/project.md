# Project

## What

**Sparks Parfums** — tienda de e-commerce de perfumería de alta concentración (fragancias árabes,
nicho e inspiraciones de alta duración) en Buenos Aires.

Hoy el negocio vende por WhatsApp y no tiene catálogo navegable. El sitio existe para que el
cliente pueda explorar por familia olfativa, comparar precios y armar un pedido antes de escribir —
sin quitar a WhatsApp del centro: la compra se cierra ahí.

Dirección de diseño: editorial de lujo silencioso. Tinta casi negra sobre hueso cálido, serif
display, líneas de 1px en lugar de sombras, cero radios salvo en chips. Bilingüe es-AR / en.

## Structure

Monorepo por servicios, cada uno autocontenido en Docker (ver `architecture.md`):

- `web/` — storefront Next.js. Fase 1 publicada en local (home, catálogo, ficha,
  carrito, búsqueda). Falta el cupón (T083, reglas sin definir).
- `api/` — backend propio (catálogo, pedidos, autenticación). **Todavía no existe**; se desarrolla
  después. Su contrato se define desde `web/src/lib/api/contract.ts`.
- `docker/` — orquestación del stack completo.

## Fuentes de verdad del diseño

- `Tienda perfumes diseño web.pdf` (v1.0 · 2026) — especificación técnica de diseño: tokens,
  tipografía, componentes con estados, grillas, breakpoints, assets, accesibilidad e i18n.
  **Cualquier desvío vuelve a este documento antes de codificarse.**
- Prototipo navegable: `https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj`
  (el PDF lo nombra `Sparks Perfumes.dc.html`).

## Status

Fase 1 del storefront cerrada salvo T083 (cupón). Siguiente: spec de Fase 2
(checkout, login, registro, cuenta, contacto) y el servicio `api/`.
Ver `progress.md` y `specs/001-storefront-fase-1/`.
