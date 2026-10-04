# Plan técnico · 019 Usuarios del backoffice

- **Estado:** implementado (2026-09-30)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0026](../../decisions/0026-usuarios-del-panel-sin-datos-inventados.md).
  Reusa el bearer en `sessionStorage`
  ([ADR-0014](../../decisions/0014-sesion-backoffice-session-storage.md)),
  el 401 que cierra sesión
  ([ADR-0020](../../decisions/0020-catalogo-401-cierra-sesion.md)),
  la cuenta de 007
  ([ADR-0011](../../decisions/0011-sesion-borrado-logico-y-clave-obligatoria.md))
  y la regla de no inventar datos
  ([ADR-0013](../../decisions/0013-cuenta-sin-datos-inventados.md)).
  No toca la vidriera
  ([ADR-0003](../../decisions/0003-capa-de-datos-desacoplada.md)).

## 1 · Enfoque

Tres capas, en este orden.

La API gana `GET /users`, `POST /users` y `PATCH /users/{id}` sobre la
tabla que ya existe. No hay migración: nivel, notas, pedidos y gasto
no se agregan.

El panel habla con `/api/users` en su propio origen. Esa ruta reenvía
a `API_BASE_URL` con el bearer, igual que el catálogo. No es un proxy
genérico.

`/usuarios` deja el título suelto y monta la tabla, las dos pestañas y
los dos cajones. Equipo queda vacío. Los hovers, el cursor y las
animaciones son los del artefacto, no los de la tabla de seis columnas
que tuvo Catálogo antes de ADR-0021.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `api/app/schemas/auth.py` | `UserCreate` y `UserAdminPatch`. Reusan `clean_name`, `clean_email`, `clean_phone` |
| `api/app/api/routes/users.py` | Listar, crear, corregir |
| `api/app/main.py` | Incluye el router |
| `api/tests/e2e/test_users_admin.py` | AC-7 |
| `backoffice/src/lib/users/contract.ts` | Zod de `UserPublic`, el mismo que devuelve 007 |
| `backoffice/src/lib/users/client.ts` | `listUsers`, `createUser`, `updateUser` |
| `backoffice/src/lib/users/form.ts` | Qué falta antes de enviar. No habla con la red |
| `backoffice/src/lib/users/proxy.ts` | Reenvía GET, POST y PATCH. Reusa `x-sparks-token` |
| `backoffice/src/app/api/users/route.ts` | GET y POST |
| `backoffice/src/app/api/users/[id]/route.ts` | PATCH. Id que no es uuid: 404, sin llamar a la API |
| `backoffice/src/app/globals.css` | `slideIn` y `fadeUp` |
| `backoffice/src/components/users/users-screen.tsx` | Pestañas, tabla, vacío de Equipo, aviso |
| `backoffice/src/components/users/user-drawer.tsx` | Alta, edición, zona sensible, diálogo |
| `backoffice/src/app/(panel)/usuarios/page.tsx` | Monta la pantalla |
| `backoffice/src/content/nav.ts` | Usuarios sin `count` |
| Tests colocados de client, form, proxy, pantalla y cajón | AC-1…AC-6, AC-8 |

`web/` no se edita. No hay dependencia nueva. El gate no gana un check.

## 3 · API

`users.py` usa `ReadyDep` y `SessionDep`, como `me.py`. El listado
ordena por `created_at` descendente y aplica `limit` (default 50, tope
100). Devuelve `UserPublic`. No filtra `active`.

`UserCreate`: `first_name`, `last_name`, `email`, `phone`, `password`.
`extra = forbid`. La contraseña pasa por `validate_password_pair` con
las dos copias iguales, así la política de 007 no se duplica y el cajón
sigue teniendo un solo campo. El alta copia el armado de
`auth.register`: hash, `terms_accepted_at = now`, `active = true`,
`must_change_password = false`. No abre sesión y no devuelve token.
409 `email_taken` con el mismo texto «Ese correo ya está registrado»,
también si la fila inactiva ya tiene ese correo.

`UserAdminPatch`: los cuatro datos de perfil, `password` y `active`,
todos opcionales. Un null explícito es 422, como `UserPatch`. Contraseña
ausente o `""` no toca el hash. Si viene, la misma validación en par.
`active` sólo cambia el booleano; no revoca sesiones en esta rebanada
(el login ya rechaza `active = false`). 404 si no hay fila.

`@audited` en el POST (`action="create"`, `resource="users"`) y en el
PATCH (`action="update"`). El payload es el `UserPublic` devuelto. El
decorator ya tira `password` y `password_hash`. El GET no lleva
decorator: un listado no es la escritura que 012 pide opt-in, y las
rutas de cuenta siguen sin auditar la lectura.

## 4 · Proxy y cliente

El page de Next sigue en el servidor y no lee el token. La pantalla es
de cliente. Manda `Authorization: Bearer` y `x-sparks-token`, como el
catálogo. La route handler usa `forward` de `lib/users/proxy.ts`:

- Sin bearer, 401 y no llama a la API.
- GET y POST hacia `{API_BASE_URL}/users`.
- PATCH hacia `{API_BASE_URL}/users/{uuid}`.
- Devuelve el status y el JSON tal cual.

`createUsersClient("")` pega en el mismo origen. En el test, la base es
un loopback que imita el JSON de 007.

| Método | HTTP |
|--------|------|
| `listUsers` | `GET /users` |
| `createUser` | `POST /users` JSON |
| `updateUser` | `PATCH /users/{id}` JSON |

El resultado es `{ ok: true, user | users }` o `{ ok: false, status, detail }`.
`detail` texto se conserva. Una lista de validación se aplana a
«Faltan datos o no son válidos.» Red caída: la misma frase `unavailable`
del login. 401: `endSession` y `/login`.

## 5 · Pantalla

`UsersScreen` pide el listado al montar, cuando la sesión ya rehidrató.
Sin token, no llama. 401 cierra sesión.

El filtro es local, sobre esa página de hasta 50:

| Chip | Qué deja |
|------|----------|
| Todos | Todas |
| Sparks Club | Ninguna |
| Invitados | Ninguna |
| Bloqueados | `active === false` |

La búsqueda es `includes` sobre nombre, apellido, email y teléfono, en
minúsculas. El conteo de la pestaña Clientes es el total traído, no el
filtrado. El resumen usa el filtrado: «N CLIENTES · — HISTÓRICO».

La fecha sale de `Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })`.
Iniciales: primera letra de nombre y de apellido, en mayúscula.

Cada fila es `<button type="button">`. Hover
`hover:bg-[rgba(20,16,14,0.03)]` con `transition-colors duration-150`.
El artefacto no pone duración; 150ms hace visible el color sin cambiarlo.
Chips, pestañas y botones del cajón: `cursor-pointer` y
`transition-colors duration-150`. El input de búsqueda no lleva
`cursor-pointer`.

Equipo no renderiza la grilla ni los permisos. Un párrafo con el vacío.

`PageHeading` ya tiene el kicker en oro a 10px. La acción «Nuevo
cliente» sólo se monta si la pestaña es Clientes. Clases del botón:
fondo ink, texto canvas, `text-[11px] tracking-[0.16em] uppercase`,
`hover:bg-accent-gold`, `cursor-pointer`.

El `10` sale de `nav.ts`. Los tests de `content/__tests__/panel.test.ts`
y `shell/__tests__/shell.test.tsx` dejan de esperar ese conteo en
Usuarios. Pedidos, Mensajes y Cupones siguen con el suyo.

## 6 · Cajón

Portal a `document.body`, como el de producto. Backdrop `z-[100]`,
cajón `z-[101]`, `w-[560px]`, `role="dialog"`, `aria-modal="true"`,
`aria-labelledby`. Animación `slide-in` 0.3s con la curva del artefacto.
`motion-reduce:animate-none`.

El backdrop no cierra: el artefacto no le pone click. Cierran × y
Cancelar. Escape también cierra y devuelve el foco al botón que abrió
(la fila o «Nuevo cliente»). Eso no está dibujado; es el teclado del
diálogo.

Campos con el subrayado del artefacto (`border-b`, 14.5px), el área de
notas con borde completo, los select con `cursor-pointer`. Grilla de
dos columnas; email y notas ocupan las dos.

| Control | Alta | Edición | Viaja |
|---------|------|---------|-------|
| Nombre, apellido, email, teléfono | vacíos | los de la fila | sí, si cambiaron |
| Contraseña | obligatoria | vacía, hint del artefacto | sólo si tiene texto |
| Nivel | Invitado seleccionado, sin efecto | igual | no |
| Estado | Activa | la de la fila | `active` |
| Notas | vacías | vacías | no |

`form.ts` rechaza, sin red, nombre, apellido, email o teléfono vacíos.
En el alta, también la contraseña vacía: «Completá la contraseña.» No
reimplementa la política; un 422 muestra el `detail`.

Bloquear / Desbloquear sólo cambian el select del draft. El label es
«Bloquear» si el draft está Activa y «Desbloquear» si está Bloqueada.

Eliminar cuenta abre el `alertdialog` con el texto del artefacto,
`fadeUp` 0.22s, backdrop `z-[110]` que sí cancela, diálogo `z-[111]`.
«Sí, eliminar» cierra el diálogo, deja la fila, y el cajón muestra
`role="alert"` con «Todavía no se puede eliminar la cuenta.» No hay
toast de eliminado.

Éxito: cierra, actualiza la lista en memoria (alta al principio;
edición reemplaza esa fila) y muestra el aviso 2,2 s en `z-[120]`,
`role="status"`, `fadeUp` 0.25s. Textos: «Cliente creado», «Cliente
actualizado».

Las tres fichas de la edición siempre dicen `—`. No se calcula un
ticket.

## 7 · Tests

Pytest contra Postgres, sin AWS. Vitest del backoffice con `--no-deps`.
jsdom no calcula el hover: el test afirma la clase, como en Catálogo.

| AC | Dónde |
|----|--------|
| 1 | `users-screen`: dos pestañas; una fila pinta nombre, email, teléfono, alta y Activa; nivel y pedidos son `—`; Equipo muestra el vacío y no «Permisos por rol»; el nav de Usuarios no tiene `10` |
| 2 | La fila tiene `cursor-pointer` y `hover:bg-[rgba(20,16,14,0.03)]`. Guardar tiene `hover:bg-accent-gold`. Eliminar cuenta tiene el hover `#B4443A`. El cajón tiene la clase de `slideIn`; el diálogo, la de `fadeUp` |
| 3 | «Nuevo cliente» muestra el kicker. Enviar vacío no llama a `createUser`. El 201 cierra y muestra «Cliente creado». El 409 deja el cajón y el detalle |
| 4 | El clic de la fila muestra el email guardado y «Cliente · alta ». Guardar llama a `updateUser` con el id y sin `password` si el campo sigue vacío. El cuerpo no trae `tier` ni `notes` |
| 5 | Bloquear no llama a `updateUser`. Guardar después manda `active: false` |
| 6 | «Sí, eliminar» no llama al cliente. La fila sigue. Aparece el aviso de que no se puede eliminar |
| 7 | Pytest: 401 sin bearer; el listado mezcla activa e inactiva y el JSON no tiene `password_hash`; POST sin contraseña es 422 y el conteo no sube; PATCH al correo de otra fila es 409; el audit no contiene la contraseña |
| 8 | El proxy reenvía el bearer y, sin él, responde 401 sin fetch. Diff vacío en `web/` |

Reduced motion se afirma con la clase `motion-reduce:animate-none`, no
con un media query calculado.

## 8 · Riesgos

- Nivel y notas se pueden completar y, al guardar, no quedan. La tabla
  sigue en `—`. Es el mismo hueco que tuvo familia antes de persistirse.
- Sparks Club e Invitados vacían una tabla que sí tiene filas. Hasta
  que exista el nivel, el chip no puede significar otra cosa sin
  inventar socios.
- «Sí, eliminar» y el párrafo del diálogo prometen un borrado que esta
  rebanada no hace. El aviso posterior lo dice. Cuando haya pedidos y
  cupones ligados a la cuenta, el borrado es otra spec: no cabe en
  `active = false`.
- Bloquear no revoca las sesiones abiertas. El próximo request
  autenticado sigue válido hasta que expire, si la dependencia no
  vuelve a leer `active`. Hay que confirmarlo en la implementación: si
  `get_authenticated` no recarga `active`, el PATCH de bloqueo también
  revoca `sessions` de esa fila. Eso no cambia el contrato del cajón.
- El listado corta en 50. Un cliente más viejo no aparece y el operador
  no tiene página siguiente.

## 9 · Hecho en la implementación

`get_authenticated` vuelve a leer `users.active` en cada request. Un
cliente bloqueado recibe 401 en la llamada siguiente sin revocar la
fila de `sessions`. El `PATCH` no las toca.

La pantalla, el proxy y la API están en el repo. La siguiente pasada,
si hace falta, es roles o el borrado real de la cuenta.
