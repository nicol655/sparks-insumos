# ADR 0009: Kickers oro a 10px

- **Status:** accepted
- **Date:** 2026-09-23
- **Deciders:** producto (fidelidad al prototipo)

## Context

El prototipo pinta las etiquetas editoriales (TIENDA, Envíos, Sparks Club,
01–04) en IBM Plex Mono **10px** `#8A6B32`. RNF-2 las subía a 24px porque
ese oro es 4.4:1 sobre canvas. A 24px dejan de ser un kicker y se leen como
título: se pierde lo mínimo del diseño.

## Decision

Los **kickers mono** (uppercase, tracking amplio, una o dos palabras) usan
oro a **10px**, como el proto. Títulos y cuerpo en oro siguen ≥24px
(«Se recuerda.», precios). Constantes: `GOLD_KICKER` / `GOLD_INDEX` en
`gold-kicker.ts`.

## Alternatives considered

- Dejar 24px — se descarta: rompe el tono del diseño.
- 10px tinta + raya oro — mantiene el tamaño, pierde el oro en la letra.

## Consequences

Chrome marca 4.4:1 sobre canvas y 3.8:1 sobre ink. El E2E de axe deja
pasar solo esos kickers 10px `#8A6B32` (el resto del contraste sigue
bloqueando). No se vuelve a 24px.
