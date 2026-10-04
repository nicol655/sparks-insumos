# ADR 0017: La auditoría es opt-in y el actor viaja en el request

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** producto (pedido de `/plan` de 012)

## Context

012 pide guardar sólo las acciones que un requisito marque. Hoy la
sesión de SQLAlchemy entra por `Depends(get_session)` y el usuario por
`Depends(get_authenticated)`. Un decorator no ve esas dependencias si
nadie las deja en un contexto del request.

El cuerpo de un cambio de contraseña trae la clave. Copiar el body
entero al audit la persistiría.

## Decision

No hay middleware que audite cada request. Hay un decorator `audited`
que la ruta futura declara.

`get_session` y `get_authenticated` guardan la sesión y el `user_id` en
`ContextVar` y los limpian al terminar el request. El decorator lee
esas variables. No recibe el usuario por argumento. Sin `user_id`, no
inserta.

El payload por defecto es null. Sólo se guarda lo que devuelve la
función `payload` que la ruta pasa. Si ese objeto contiene `password`,
`password_confirmation`, `password_hash`, `access_token` o `token` en
cualquier nivel, la escritura falla y no hay fila.

La fila se inserta después de que la ruta retorna, en la misma sesión,
y se confirma ahí. Una excepción de la ruta no escribe.

Los GET usan `require_password_changed`, igual que `/me`. No se inventa
un rol.

## Alternatives considered

- **Middleware de todas las requests.** Auditaría health, login y
  rutas que el negocio no marcó.
- **Pasar `user` y `session` al decorator en cada ruta.** El pedido
  pide mover la autenticación como ya se mueve la conexión.
- **Serializar el body solo.** El ejemplo de cambio de contraseña
  quedaría con la clave en la tabla.
- **Commit único obligatorio, y prohibir el commit dentro de la ruta.**
  Obliga a reescribir las rutas actuales. El decorator confirma la fila
  después; si la ruta ya confirmó su cambio, el audit es un segundo
  commit. El hueco entre ambos queda aceptado hasta que una spec lo
  cierre.

## Consequences

Las rutas actuales no escriben audit (AC-10). El reset de tests borra
`audits` antes que `users`, porque la FK no es en cascada. Cuando
existan roles, la lectura deja de ser «cualquier cuenta».
