# ADR 0011: Sesión bearer opaca, borrado lógico y clave obligatoria

- **Status:** accepted
- **Date:** 2026-09-25
- **Deciders:** Nico + agente

## Context

La spec [007](../specs/007-api-autenticacion/spec.md) pide login con correo y
contraseña, logout que invalide la sesión, `DELETE /me` como borrado lógico
(`active`) y un flag que deja al usuario autenticado pero sin permiso hasta
cambiar la contraseña (403, no un fallo de credenciales). El login de ese
usuario tiene que demostrar que la clave es correcta.

Cada request protegido tiene que ver `active` y el flag: pueden cambiar
después de emitido el token. Logout tiene que ser efectivo en el servidor.
Swagger tiene que poder pegar el token y probar las rutas.

La constitución (principio 4 y §6) pide el diseño más simple y ningún secreto
en el repo. RF-4 pide, aun así, un usuario local `admin@sparksinsumos.com` /
`admin123456` con el flag en true.

## Decision

- **Bearer opaco.** El login genera `secrets.token_urlsafe`, devuelve el claro
  una vez y guarda sólo su SHA-256 en `sessions` (con vencimiento y
  `revoked_at`). No se usa JWT.
- **Argon2** vía `pwdlib` para `password_hash`. Ni respuestas ni la migración
  guardan la clave en claro.
- El usuario base se inserta en la primera migración de Alembic. El hash lo
  calcula el mismo módulo de la app desde `BOOTSTRAP_ADMIN_PASSWORD`, cuyo
  default local es `admin123456` (documentado en `.env.example`, sobrescribible).
  `must_change_password = true`.
- Dependencia de sesión: 401 si no hay token válido o si `active` es false.
  Dependencia aparte, en todas las rutas autenticadas menos
  `POST /auth/change-password`: si el flag es true, **403**
  `password_change_required` con el texto de que el usuario es correcto y no
  tiene permiso hasta cambiar la contraseña.
- `DELETE /me` pone `active = false` y revoca las sesiones. No borra la fila.
  El correo sigue siendo único, activo o no.
- El cambio de contraseña sólo funciona con el flag en true, pide clave nueva
  y repetición (no la actual), exige la política de la spec (8–128, clases,
  sin espacios) y rechaza una clave igual a la vigente. Con el flag en false
  responde **403** `action_denied` («Acción denegada») y no toca el hash.
  Así no queda un reset autenticado permanente sin la clave anterior.
- La semilla `admin123456` no pasa esa política. El hash de la migración no
  la valida; registro y cambio sí. La sesión dura 6 horas.
- Login fallido, correo inexistente y cuenta inactiva comparten el mismo 401.

## Alternatives considered

- **JWT firmado sin estado.** Encaja con el botón Authorize de Swagger, pero
  logout obliga a una lista de `jti` y el flag obliga a leer el usuario igual.
  Dos mecanismos para un problema que la tabla `sessions` resuelve sola.
  Swagger sigue pudiendo pegar el bearer opaco.
- **Cookie de sesión.** Peor de probar en Swagger y el frontend todavía no
  existe. El bearer es el contrato hasta la spec que conecte `web/`.
- **401 para el flag.** Indistinguible de «no estás logueado». La spec pide
  decir que el usuario es correcto y que el permiso falta. 403 + `code` lo
  hace.
- **Borrar la fila en `DELETE /me`.** Contradice el borrado lógico y el campo
  `active`.
- **Reutilizar el correo de una fila inactiva.** Exige reactivar o duplicar.
  La spec no pide reactivación; el único simple evita heredar la cuenta vieja.
- **Poner `admin123456` en claro dentro del archivo de migración.** Viola el
  espíritu de «no secretos en la base» y acopla el SQL a un hash que caduca
  si cambia el algoritmo. Hashear en la migración con el módulo de la app
  mantiene un solo camino.

## Consequences

- Toda ruta autenticada pega a la base. Es el costo de logout real y del flag.
- El default `admin123456` está en el repo como alta local, no como secreto
  de producción. Publicar el servicio con ese default deja una cuenta que sólo
  puede cambiar su propia clave: sigue siendo inaceptable fuera de local, y
  esta spec no incluye el deploy.
- No hay cambio voluntario de contraseña. Hace falta otra spec (clave actual
  + clave nueva) cuando el negocio lo pida.
- Logout, perfil y borrado responden 403 mientras el flag esté en true. Es lo
  que pide «cualquier otra acción».
