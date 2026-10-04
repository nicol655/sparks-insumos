# ADR 0014: Sesión del backoffice en Zustand + sessionStorage

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** Nico (pedido de `/plan`) + agente

## Context

La spec [010](../specs/010-backoffice/spec.md) pide un servicio aparte del
storefront y guardar el token con Zustand en `sessionStorage`. El login
sigue siendo el de [007](../specs/007-api-autenticacion/spec.md):
`POST /auth/login` devuelve un bearer en JSON. No manda `Set-Cookie`.

[ADR-0012](./0012-sesion-storefront-cookie-httponly.md) guardó ese bearer
en una cookie httpOnly para la tienda, justamente para que un script de la
página no lo lea. El pedido del backoffice elige el otro lado: el token
tiene que estar en el store del cliente.

`api/` no declara CORS. El navegador, en el host, tampoco resuelve el
nombre Docker `api`. La tienda llama a la API desde server actions por
eso.

## Decision

- App nueva en `backoffice/`. No vive dentro de `web/` y no comparte su
  cookie `sparks_session`.
- El formulario no hace `fetch` directo al contenedor `api/`. El
  navegador llama a `POST /api/auth/login` (Route Handler), que reenvía
  a `API_BASE_URL` (`http://api:8000` dentro de Compose) y **propaga el
  status HTTP** (401/403/200) como `application/json`. El cliente parsea
  el 200 con Zod o mapea el código de error. No se usa una server action
  para el login (esas respuestas van siempre 200 con protocolo Flight).
- El cliente escribe `{ accessToken, mustChangePassword }` en Zustand con
  `persist` y `createJSONStorage(() => sessionStorage)`, clave
  `sparks-backoffice-session`. Prohibido `localStorage` y prohibida una
  cookie con el bearer.
- La guarda es una función pura más un componente cliente. Next middleware
  y los RSC no leen `sessionStorage`, así que no se usa middleware para
  autorizar. Hasta rehidratar, la guarda no redirige.
- `/dashboard` en esta spec no renderiza datos de la API. Cualquier pantalla
  futura que muestre datos de cuenta los pide en el cliente, con el bearer
  del store. No se leen secretos en un RSC: el servidor no tiene el token.

## Alternatives considered

- **Cookie httpOnly, como la tienda.** Más seguro frente a XSS y permite
  guarda en el servidor. Contradice el pedido, que fija Zustand y
  `sessionStorage`.
- **`localStorage`.** Sobrevive al cerrar la pestaña y alarga la exposición
  del bearer más allá de la sesión de navegador. El pedido dice session
  storage.
- **`fetch` del navegador a `localhost:8000`.** Exige CORS en `api/` y
  acopla el puerto publicado. Esta spec no modifica 007.
- **Middleware de Next con el token en cookie.** Vuelve al diseño de 0012.

## Consequences

- Un XSS en el backoffice puede leer el bearer mientras la pestaña sigue
  abierta. La constitución (principio 6) queda peor cubierta que en la
  tienda. Se acepta porque el pedido lo exige y el panel de esta spec no
  muestra datos.
- Cerrar la pestaña borra el token local aunque al servidor le queden
  horas de validez. Hace falta volver a entrar. No hay logout en 010: no
  se revoca la fila de `sessions` al cerrar.
- La guarda parpadea en blanco hasta rehidratar, en lugar de mandar a
  `/unauthorized` a alguien que sí tenía sesión.
- `curl` a `/dashboard` recibe el HTML vacío. No es un control de acceso
  de servidor.
