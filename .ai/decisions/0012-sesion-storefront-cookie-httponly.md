# ADR 0012: Sesión del storefront en cookie httpOnly

- **Status:** accepted
- **Date:** 2026-09-25
- **Deciders:** Nico + agente

## Context

La spec [008](../specs/008-cuenta-storefront/spec.md) pide guardar la sesión
en cookies y llamar a los endpoints de
[007](../specs/007-api-autenticacion/spec.md). Ese servicio entrega un bearer
opaco en JSON (`access_token`). No manda `Set-Cookie`. ADR-0011 deja el
token en claro sólo en esa respuesta y guarda el hash en `sessions`.

El chrome (header, menú, footer) es cliente y hoy se prerenderiza. Leer la
cookie de sesión en el layout de `[locale]` volvería dinámicas todas las
páginas. Poner el bearer en `document.cookie` o en `localStorage` lo deja
a mano de cualquier script de la página (constitución, principio 6).

## Decision

- El navegador habla con **server actions** de Next, no con `api/` directo.
  La action valida el cuerpo, llama a `API_BASE_URL` y traduce el resultado.
  Los componentes no hacen `fetch` (ADR-0003).
- El bearer se guarda en la cookie `sparks_session`: `HttpOnly`,
  `SameSite=Lax`, `Path=/`, `Max-Age=21600`, `Secure` fuera de desarrollo.
  El JavaScript de la página no la lee.
- Una segunda cookie, `sparks_signed_in=1`, con los mismos plazo y `Path`,
  **sin** `HttpOnly` y **sin** el token. El chrome la lee al montar, igual
  que el carrito espera `hydrated`, y cambia «Ingresar» por «Mi cuenta».
  El layout no llama a `cookies()` y sigue pudiendo prerenderizarse.
- Login, logout y `DELETE /me` escriben o borran **las dos**. Un 401 en
  `/cuenta` también. Logout borra las dos aunque `POST /auth/logout` no
  sea 204.
- `API_MODE` no gobierna la cuenta. El catálogo sigue en mock. La cuenta
  usa `API_BASE_URL` (en Compose, `http://api:8000`).

## Alternatives considered

- **Bearer en una cookie legible o en `localStorage`.** Cumple «guardar en
  cookies» a medias y expone el token a XSS.
- **Que `api/` haga `Set-Cookie`.** Cambia 007, exige CORS con credenciales
  y acopla el host del storefront al de la API. Esta rebanada no modifica
  el contrato.
- **Leer `sparks_session` en el layout.** Una sola cookie, y todas las
  rutas dejan de ser estáticas.
- **Pedir `GET /me` en cada página para pintar el header.** Un round-trip
  de más, y el layout pasa a depender de que `api/` esté levantada.

## Consequences

- Un XSS no lee el bearer. Sí puede ver que hay sesión (`sparks_signed_in`).
- La cookie de presencia puede quedar mintiendo si el token se revocó en el
  servidor y nadie pasó por `/cuenta`. El header dice «Mi cuenta» hasta el
  401, que borra las dos.
- El admin con `must_change_password` obtiene cookie (el login es 200) y
  `GET /me` responde 403. No hay pantalla de cambio de clave en 008.
- Los tests de `web` mockean el cliente HTTP. El gate sigue con `--no-deps`.
