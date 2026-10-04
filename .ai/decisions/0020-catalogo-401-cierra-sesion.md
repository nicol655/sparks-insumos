# ADR 0020: Un 401 del catálogo cierra la sesión del panel

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** producto (el catálogo decía sin autenticación y `/login` volvía al dashboard)

## Context

`decideRedirect` trata cualquier `accessToken !== null` como sesión. `/login`
con ese token va a `/dashboard`. El dashboard no llama a la API, así que un
token que el catálogo no puede usar sigue pareciendo una sesión válida.

El listado sí llama al proxy. En el caso reportado el route handler respondió
401 `not_authenticated` sin llegar a FastAPI: no vio `Authorization`. El
token seguía en Zustand, y la guarda no dejaba quedarse en `/login`.

## Decision

- El cliente manda el bearer en `Authorization` y en `x-sparks-token`
  (`CATALOG_TOKEN_HEADER`). El proxy usa el primero si es `Bearer <token>`
  y, si no, el segundo. Hacia `API_BASE_URL` sólo sale `Authorization`.
  El token no va en la query ni en una cookie.
- Si el catálogo responde 401, el panel llama `clearSession()` y
  `router.replace("/login")`. La guarda, al ver el token en `null` todavía
  sobre `/catalogo`, elegiría `/unauthorized`. Ese rebote, sólo después de
  este 401, pasa a ser `/login`. Quien nunca tuvo sesión sigue yendo a
  `/unauthorized`. Un 403 (cambio de clave) no cierra la sesión.

## Alternatives considered

- **Borrar la sesión en cada 401 del proxy, sin el segundo header.** Si el
  header se pierde otra vez, cada alta de sesión vuelve a 401 y el operador
  queda en un loop de login.
- **Dejar el 401 en pantalla y un botón para salir.** El operador ya no
  podía llegar al login: la guarda lo devolvía al dashboard antes de que
  pudiera borrar el token a mano.
- **Poner el bearer en una cookie.** ADR-0014 lo prohíbe en el panel.

## Consequences

- Un token rechazado por la API (401) también vuelve al login. Es el mismo
  síntoma: el panel cree que hay sesión y el catálogo no.
- Un 403 de `password_change_required` sigue mostrando el texto de la API
  y deja el token en su lugar.
