# ADR 0008: allowedDevOrigins para hidratar en el E2E

- **Status:** accepted
- **Date:** 2026-09-22
- **Deciders:** agente (Fase 6)

## Context

El servicio `e2e` abre el storefront en `http://web:3000`, no en `localhost`. Next 16 +
Turbopack rechaza el upgrade WebSocket de HMR cuando el `Host` no es un origen de
desarrollo conocido (`ERR_INVALID_HTTP_RESPONSE` en `ws://web:3000/_next/hmr`).

Sin ese canal el cliente **no hidrata**: no hay `__reactFiber` en el DOM, los `onClick`
no existen y el drawer, el toast y el contador del carrito no aparecen. Los E2E
anteriores no lo notaron porque catálogo y ficha se cubren con `Link` y HTML del
servidor (ADR-0007). El síntoma «los botones no hidratan en Playwright» era este
bloqueo, no un fallo de Testing Library.

## Decision

`web/next.config.ts` declara `allowedDevOrigins: ["web", "localhost", "127.0.0.1"]`.
El E2E del carrito espera `#header-cart[data-hydrated=true]` antes de hacer click.

## Alternatives considered

- **E2E contra la etapa `runner`**: hidrata sin HMR, pero obliga a rebuild de imagen
  en cada cambio. Demasiado lento para el loop actual.
- **`next dev --no-turbo`**: posible, pero cambia el servidor de todo el equipo por
  un detalle del hostname de Compose.

## Consequences

- Cualquier E2E que dependa de un `onClick` (drawer, toast, stepper, menú) necesita
  este origen y, si corre contra `next dev`, una señal de hidratación.
- `localhost` y `127.0.0.1` quedan permitidos para el navegador del host (`WEB_PORT`).
- Hidratar también hace que Next intercepte los `<a>` del mismo origen. Los chips del
  catálogo hacen `location.assign` para no quedarse con el `query` del RSC anterior.
