# 012 · Auditoría de acciones

- **Estado:** aprobada (pedido de `/plan`, 2026-09-28)
- **Fecha:** 2026-09-28
- **Padre:** [007](../007-api-autenticacion/spec.md) publica la cuenta y el
  bearer. Esta spec no cambia `web/` ni `backoffice/`, y no marca como
  auditable ninguna ruta que ya exista.

## Problema

No hay registro de quién hizo qué. Cuando una acción futura tenga que
dejar huella, no existe ni la tabla, ni una forma de escribirla sin
pasar a mano el usuario y la sesión, ni una lectura autenticada.

No todo el sistema se audita. Cada requisito de ahora en adelante dirá
qué acción entra. Esta rebanada sólo deja la herramienta lista.

## Objetivo

Una fila append-only por acción marcada, escrita desde un decorator de
Python que lee al usuario autenticado y la sesión del request. Dos GET
en Swagger, con DTO de salida, para quien ya pasó el cambio de
contraseña. Ninguna ruta actual llama al decorator.

## Alcance

### Dentro

1. Tabla de auditoría y su migración.
2. El usuario autenticado y la sesión de base disponibles durante todo
   el request, del mismo modo en que hoy la sesión entra por
   dependencia.
3. Un decorator para usar en rutas futuras. Guarda la fila sólo si la
   ruta termina sin excepción.
4. DTO de salida y `GET /audits` más `GET /audits/{id}`, autenticados.
5. Tests de la escritura, del payload y de los GET.

### Fuera

- Llamar al decorator desde login, registro, logout, cambio de
  contraseña, `/me` o cualquier otra ruta ya publicada. Eso llega como
  criterio de una spec posterior.
- POST, PUT, PATCH o DELETE del audit. Nadie inserta por HTTP.
- Roles. Cualquier cuenta que ya puede llamar a `/me` puede leer el
  audit. No hay filtro por operador.
- Filtros, búsqueda, paginación por cursor, ni pantalla en el backoffice.
- Auditar un error. Si la ruta lanza, no hay fila.

## Modelo

Tabla `audits`. Append-only: sin `updated_at` y sin borrado.

| Columna | Regla |
|---------|--------|
| `id` | UUID, clave primaria |
| `user_id` | UUID, no nulo, FK a `users.id`. Es quien ejecuta, no un id del cuerpo |
| `action` | Texto. `create`, `read`, `update`, `delete`, o un token custom (`user_password_reset`). Minúsculas, dígitos y `_`, 1 a 64 caracteres |
| `resource` | Nombre de la tabla afectada (`products`) o null. Mismo alfabeto y tope, cuando viene |
| `payload` | JSON o null. Lo arma quien llama. No se copia el body solo |
| `created_at` | Fecha y hora con zona, puesta por la base al insertar. El cliente no la manda |

## Escritura

El decorator se declara en la ruta, debajo del decorator de FastAPI:

```text
@router.patch("…")
@audited(action="update", resource="products", payload=…)
async def …
```

- `action` es obligatorio.
- `resource` por defecto es null.
- `payload` es una función opcional. Recibe los mismos argumentos que
  la ruta y el valor devuelto. Su retorno es el JSON guardado. Si no
  se pasa, la columna queda null.
- El `user_id` sale del request autenticado. Si el decorator corre sin
  ese usuario, no inserta y la llamada falla.
- La sesión es la del request. La fila se inserta después de que la
  ruta retorna, y se confirma en esa misma sesión.
- Si `payload` devuelve un objeto con la clave `password`,
  `password_confirmation`, `password_hash`, `access_token` o `token`
  en cualquier nivel, no se inserta y la llamada falla. La contraseña
  no queda en la base.

Ejemplos de uso futuro, no de esta rebanada:

| Quién | Acción | Resource | Payload |
|-------|--------|----------|---------|
| Usuario 1 cambia el precio de un producto | `update` | `products` | `{"price": …}` |
| Admin 1 reinicia la contraseña del usuario 1 | `user_password_reset` | null | `{"target_user_id": "…"}` |
| Usuario 1 cambia su contraseña | `update` | `users` | sin la contraseña, por ejemplo `{"user_id": "…"}` |

## Lectura

Las dos rutas exigen el bearer y el mismo permiso que `/me`: sin token,
401 `not_authenticated`; con `must_change_password`, 403
`password_change_required`.

| Método | Ruta | Respuesta |
|--------|------|-----------|
| GET | `/audits` | Lista del DTO, de la más nueva a la más vieja. `limit` opcional, default 50, máximo 100. Sin filas, `[]` |
| GET | `/audits/{id}` | Un DTO. Si no existe, 404 `not_found` |

DTO de salida, y nada más:

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `user_id` | UUID |
| `action` | string |
| `resource` | string o null |
| `payload` | objeto o null |
| `created_at` | datetime |

Swagger muestra esos dos GET y no un método de escritura. El esquema de
seguridad es el bearer que ya existe.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como desarrollador marco una ruta futura y queda la fila con quién, qué, contra qué, cuándo y el payload que yo armé |
| US-2 | P0 | Como usuario autenticado leo una fila y el listado desde Swagger, y no puedo escribir el audit por HTTP |

## Requisitos no funcionales

| # | Requisito |
|---|-----------|
| RNF-1 | Pytest en Docker, con la base de test. Sin Node y sin tocar `web/` ni `backoffice/` |
| RNF-2 | La contraseña, el hash y el token no se persisten aunque el payload los incluya |
| RNF-3 | Borrar usuarios en el reset de tests no deja huérfanas: primero se vacía `audits` |

## Criterios de aceptación

| # | Criterio |
|---|----------|
| AC-1 | La migración crea `audits` con las columnas de arriba. `user_id` referencia `users`. `resource` y `payload` aceptan null |
| AC-2 | Con usuario y sesión en el contexto, el decorator inserta `user_id`, `action`, `resource`, `payload` y `created_at` después de un retorno exitoso |
| AC-3 | Sin usuario en el contexto, no inserta |
| AC-4 | Un payload custom se guarda tal cual. Uno que trae `password` (también anidada) no se guarda |
| AC-5 | Sin `payload` y sin `resource`, esas columnas quedan null |
| AC-6 | Si la función lanza, la tabla no gana una fila |
| AC-7 | `GET /audits` y `GET /audits/{id}` sin bearer responden 401. Con `must_change_password` responden 403. Con una cuenta lista, el listado y el detalle devuelven el DTO |
| AC-8 | El listado sale de la más nueva a la más vieja. Un id desconocido es 404. `limit` por encima de 100 se rechaza |
| AC-9 | OpenAPI incluye los dos GET y ningún POST, PUT, PATCH ni DELETE bajo `/audits` |
| AC-10 | Login, registro, logout, cambio de contraseña y `/me` siguen sin escribir en `audits` |

## Cerrado el 2026-09-28

1. «No todo es auditable»: el decorator es opt-in. Un middleware global
   que grabe cada request queda descartado.
2. La lectura es para cualquier cuenta que ya pasa la guarda de `/me`.
   Un rol de operador llega con la spec de roles.
3. El tope del listado es 50 por defecto y 100 como máximo.
4. `created_at` lo pone la base. El cliente no lo envía.
5. Esta spec no engancha el decorator a ninguna ruta existente.

## Preguntas abiertas

Ninguna que bloquee el plan.
