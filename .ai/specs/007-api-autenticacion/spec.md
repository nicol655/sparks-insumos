# 007 · API de autenticación y cuenta

- **Estado:** aprobada (supuestos cerrados el 2026-09-25)
- **Fecha:** 2026-09-25
- **Padre:** [001](../001-storefront-fase-1/spec.md) dejó login, registro y
  cuenta para Fase 2. El storefront ya reserva `/ingresar`, `/registro` y
  `/cuenta`; siguen en el frontend y **esta spec no los implementa**.

## Problema

No existe `api/`. No hay dónde registrar una persona, iniciar sesión ni
leer o cerrar su cuenta. El storefront sigue en `API_MODE=mock` y no debe
cambiar en esta rebanada.

## Objetivo

Publicar el primer servicio de backend: cuentas con correo y contraseña,
sesión, perfil propio y un alta inicial que no puede usar el sistema hasta
cambiar la contraseña. Todo se prueba con pytest (unidad y e2e) y se
ejercita desde Swagger. El frontend queda para otra spec.

## Alcance

### Dentro

1. Servicio Python nuevo: FastAPI, pytest (TDD), pruebas e2e, SQLAlchemy
   con conexión async a Postgres.
2. Postgres como base de datos.
3. Dos contenedores nuevos en Docker: backend y base de datos. El de `web/`
   sigue como está.
4. Swagger (OpenAPI) disponible para probar los endpoints.
5. Endpoints de identidad y de la cuenta propia, con las reglas de abajo.
6. Primera migración con el usuario base y el flag de cambio de contraseña.
7. Tests de unidad y e2e para cada criterio de aceptación.

### Fuera

- Cualquier cambio en `web/` (pantallas, cliente HTTP, contrato Zod del
  catálogo, `API_MODE`).
- Catálogo, pedidos, carrito, cupones, contacto, verificación de correo,
  recuperación de contraseña por email, cambio voluntario de contraseña y
  rate limit.
- Roles y permisos. El usuario base no tiene rol. Van en una tarea
  siguiente.
- Textos legales de los términos. Sólo se persiste que se aceptaron.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como visitante me registro con mis datos y la aceptación de términos, sin estar autenticado |
| US-2 | P0 | Como visitante inicio y cierro sesión con correo y contraseña |
| US-3 | P0 | Como usuario autenticado veo, edito y borro de forma lógica mi cuenta |
| US-4 | P0 | Como operador encuentro el usuario base y, hasta que cambie la contraseña, no puedo usar el resto del sistema |
| US-5 | P0 | Como desarrollador pruebo los endpoints en Swagger y en pytest |

## Requisitos

### RF-1 · Registro (público)

`POST` de registro, sin autenticación. Pide:

| Dato | Regla |
|------|--------|
| Nombres | Obligatorio |
| Apellidos | Obligatorio |
| Correo | Obligatorio, único |
| Contraseña y repetir contraseña | Obligatorias, iguales, y cumplen la política de abajo |
| Teléfono | Obligatorio. Tras recortar, 6 a 32 caracteres y **empieza con `+`** (prefijo de país). Tiene al menos un dígito |
| Aceptar términos y condiciones | Tiene que ser aceptación explícita |

Política de contraseña (registro y cambio obligatorio):

- Longitud de 8 a 128 caracteres.
- Al menos una mayúscula, una minúscula, un número y un carácter especial
  (ni letra, ni número, ni espacio).
- Sin espacios en blanco en ningún lugar.
- Las dos copias, iguales.

`admin123456` **no** cumple esta política. Sólo puede existir como clave
semilla de RF-4, insertada por la migración, porque el flag obliga a
reemplazarla por una que sí cumpla. Registro y cambio la rechazan.

Respuesta de alta correcta: el cuerpo **no** incluye la contraseña ni su
hash. No inicia sesión sola. El correo se guarda en minúsculas.

### RF-2 · Login y logout

- Login: público. Credenciales = **sólo** correo y contraseña.
- Logout: exige sesión previa. Después, esa sesión deja de servir.
- La sesión dura **6 horas** (`SESSION_TTL_SECONDS` default `21600`).
  Pasado ese plazo, el token responde 401.
- Login de un usuario con `active = false` no entra.
- Registro rechaza un correo que ya existe, también si esa fila está
  inactiva. No hay reactivación en esta spec.

### RF-3 · `/me` (autenticado)

| Método | Comportamiento |
|--------|----------------|
| `GET` | Todos los valores del usuario **menos** la contraseña y su hash |
| `PATCH` | Edita una parte de los datos editables |
| `PUT` | Reemplaza los datos editables |
| `DELETE` | Borrado **lógico**: `active` pasa a false. La fila sigue |
| `POST` | No existe. El alta es el registro |

Editables: nombres, apellidos, correo, teléfono. La contraseña no se cambia
por `/me`. `active` y el flag de cambio de contraseña no se editan por aquí.

### RF-4 · Usuario base (primera migración)

| Campo | Valor |
|-------|--------|
| Correo | `admin@sparksinsumos.com` |
| Contraseña | `admin123456` |
| Flag «debe cambiar la contraseña» | `true` |
| `active` | `true` |

No es un rol. Es un usuario más, con ese flag.

### RF-5 · Cambio obligatorio de contraseña

1. La base tiene un campo que indica si el **próximo** uso del sistema exige
   cambiar la contraseña.
2. El usuario base nace con ese flag en `true`.
3. El login de ese usuario **sí** acredita la identidad (la contraseña es
   correcta) y entrega sesión, pero no habilita el resto del sistema.
4. Endpoint nuevo, autenticado, que pide **sólo** contraseña nueva y
   repetir contraseña. Al cumplirlo, el flag pasa a `false`.
5. Con el flag en `true`, cualquier **otra** acción autenticada —incluido
   logout y `/me`— responde **403** con un cuerpo que dice que el usuario es
   correcto y que no tiene permiso porque todavía no cambió la contraseña.
6. La contraseña nueva tiene que ser distinta de la actual. Si no, el flag
   se podría apagar sin cambiarla.
7. Con el flag en `false`, ese endpoint no cambia la contraseña y responde
   **403** con el texto «Acción denegada» (`code`: `action_denied`). El
   cambio voluntario, pidiendo la clave actual, queda fuera.

### RF-6 · Swagger

La documentación interactiva y el OpenAPI listan estos endpoints y permiten
ejecutarlos, incluidos los que piden sesión (pegando el token del login).

### RF-7 · Contenedores

Dos servicios nuevos: el backend y Postgres. Levantar sólo `web/` no debe
depender de ellos. Desarrollo, tests y el gate corren en Docker, sin Python
instalado en el host (ADR-0004).

## Requisitos no funcionales

| # | Requisito |
|---|-----------|
| RNF-1 | La contraseña se guarda sólo como hash. Ni la migración ni las respuestas la persisten en claro |
| RNF-2 | Login incorrecto, correo inexistente y usuario inactivo responden el mismo 401, sin decir cuál fue |
| RNF-3 | Validar toda entrada. Un cuerpo mal formado es 422 |
| RNF-4 | Secretos de un entorno publicado no van en el repo. El valor `admin123456` es el alta local pedida en RF-4, sobrescribible por entorno |
| RNF-5 | Cada AC de abajo tiene test automatizado. La suite e2e pega a la app y a Postgres real |

## Criterios de aceptación

| # | Criterio |
|---|----------|
| AC-1 | Registro válido, sin header de auth, responde 201 y el cuerpo no trae contraseña ni hash |
| AC-2 | Registro con contraseñas distintas, sin aceptación de términos, con clave fuera de política (falta una clase, hay un espacio, o mide menos de 8) o con teléfono que no empieza con `+` o queda fuera de 6–32, responde 422 y no crea fila |
| AC-3 | Registro con un correo ya usado (activo o inactivo) responde 409 |
| AC-4 | Login con correo y contraseña correctos y `active = true` responde 200 y un bearer, sin auth previa |
| AC-5 | Login con contraseña mala, correo desconocido o `active = false` responde 401 con el mismo cuerpo |
| AC-6 | Logout con sesión responde 204 y ese token después responde 401. Sin sesión, 401. Un token ya vencido (aunque no hayan pasado 6 horas de reloj) responde 401 |
| AC-7 | `GET /me` autenticado devuelve los datos del usuario sin contraseña ni hash |
| AC-8 | `PATCH /me` actualiza sólo los campos enviados. `PUT /me` reemplaza nombres, apellidos, correo y teléfono |
| AC-9 | `DELETE /me` deja la fila con `active = false`. Un login posterior con esa cuenta es el 401 de AC-5. `POST /me` responde 405 |
| AC-10 | Tras la primera migración, `admin@sparksinsumos.com` / `admin123456` existe, `active = true` y el flag de cambio es `true` |
| AC-11 | El login de ese usuario responde 200 con el flag en true. `GET /me`, `PATCH /me`, `PUT /me`, `DELETE /me` y logout con ese token responden 403, código estable `password_change_required`, y un texto que dice que el usuario es correcto pero no tiene permiso hasta cambiar la contraseña |
| AC-12 | El endpoint de cambio, con sesión y flag en true, rechaza con 422 si las dos claves nuevas no coinciden, si la nueva es igual a la actual, o si no cumple la política (incluida `admin123456`). Si son válidas, el flag queda en false y el mismo token ya puede llamar a `GET /me` |
| AC-13 | Con el flag en false, el endpoint de cambio responde 403, `code` `action_denied`, detalle «Acción denegada», y no modifica la contraseña |
| AC-14 | `GET /docs` y el JSON de OpenAPI responden 200 y nombran registro, login, logout, cambio de contraseña y `/me` |
| AC-15 | En la base, la columna de contraseña del usuario base y de un registro nuevo no es el texto en claro |

## Cerrado el 2026-09-25

1. Contraseña: mínimo 8, máximo 128, una mayúscula, una minúscula, un número,
   un especial, sin espacios. La semilla `admin123456` no cumple y sólo vive
   en la migración.
2. Teléfono: 6 a 32 caracteres y empieza con `+`.
3. Correo en minúsculas, único aunque `active` sea false.
4. Nombres y apellidos: 1 a 80 caracteres; pueden llevar espacios.
5. Sesión: 6 horas.
6. Logout con el flag en true: 403 `password_change_required`.
7. Cambio de clave con el flag en false: 403 «Acción denegada».
8. Roles y permisos: fuera de esta spec.

## Preguntas abiertas

Ninguna.
