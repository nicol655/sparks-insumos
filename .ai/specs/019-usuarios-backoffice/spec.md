# 019 · Usuarios del backoffice

- **Estado:** aprobada (pedido de `/plan`, 2026-09-30)
- **Fecha:** 2026-09-30
- **Padre:** [007](../007-api-autenticacion/spec.md) es la cuenta que esta
  pantalla lista y escribe. [011](../011-backoffice-cascaron/spec.md) dejó
  `/usuarios` con título. [010](../010-backoffice/spec.md) y
  [ADR-0014](../../decisions/0014-sesion-backoffice-session-storage.md)
  dejan el bearer en el cliente. La constitución 17 y
  [ADR-0015](../../decisions/0015-diseno-backoffice-y-reglas-de-operacion.md)
  fijan el artefacto `NtzZJG94zfZrj3LpMvAtS9` como única fuente visual.
  [ADR-0026](../../decisions/0026-usuarios-del-panel-sin-datos-inventados.md)
  cierra lo que ese artefacto dibuja y la base no tiene.

## Problema

`/usuarios` sólo muestra el título. El operador no ve las cuentas de
007 ni puede crear o corregir una. El artefacto ya describe la pantalla:
dos pestañas, la tabla de clientes, el cajón de alta y el de edición.

No hay roles. La pestaña Equipo del artefacto lista miembros de ejemplo
y una matriz de permisos. Eso no se siembra.

## Objetivo

En Usuarios, el operador ve las cuentas que ya están en `users`, abre
un cajón para crear una y otro para editarla. El layout, los hovers, el
cursor y las animaciones salen del artefacto. La pestaña Equipo existe
y queda vacía.

## Alcance

### Dentro

1. Tabla de clientes en `/usuarios`, con las dos pestañas del artefacto.
2. Cajón para crear un cliente.
3. Cajón para editar un cliente, abierto al hacer clic en la fila.
4. Un recurso autenticado de cuentas para listar, crear y corregir lo
   que `users` ya guarda. El navegador no abre `http://api:8000`.
5. Tests de la pantalla, del cliente HTTP y de la API.

### Fuera

- Roles, invitación, último acceso y la matriz «Permisos por rol».
  La pestaña Equipo no lista a Martina, Diego ni Carla.
- Pedidos, total gastado, ticket, nivel Club / Invitado y notas
  internas como columnas. No se agregan a `users`.
- Borrar la fila. `audits.user_id` es `ON DELETE RESTRICT`. `active =
  false` ya es el borrado lógico de 007.
- Búsqueda del encabezado, paginación más allá de 50, cambio de clave
  del propio operador, `web/`.
- Hacer cumplir la constitución 14. Sigue la deuda de 010: cualquier
  cuenta que ya pasa el cambio de clave puede escribir esta pantalla.

## Qué se ve

La cáscara de 011 no cambia, salvo el `10` de Usuarios en el menú: era
relleno (constitución 17), igual que el `5` de Catálogo. El ítem queda
sin conteo.

Antetítulo: «N clientes · 0 socios del club». El cero es real: no hay
columna de nivel, así que nadie cuenta como socio. Título: «Usuarios».
En Clientes, la acción es «Nuevo cliente». En Equipo no hay «Invitar
miembro»: en el artefacto sólo dispara el aviso «Invitación enviada»,
sin crear nada.

### Pestañas

«Clientes» y «Equipo». La activa lleva el borde y el color `#14100E`.
La inactiva, `#6F665A` y borde transparente. Al lado, el conteo en mono
al 70%. Cursor `pointer`. Clientes muestra cuántas filas trajo el
listado. Equipo muestra `0`.

### Clientes

Búsqueda «Buscar por nombre, email o teléfono». Chips: Todos, Sparks
Club, Invitados, Bloqueados. El activo es fondo `#14100E` y texto
`#F5F1EA`; el resto, fondo transparente y borde `rgba(20,16,14,0.2)`.
Cursor `pointer`. El resumen, a la derecha, es «N CLIENTES · — HISTÓRICO».
La raya es el total gastado, que la API no devuelve
([ADR-0013](../../decisions/0013-cuenta-sin-datos-inventados.md),
[ADR-0021](../../decisions/0021-catalogo-layout-del-artefacto.md)).

La tabla, de borde superior `#14100E`, tiene las columnas del artefacto:
Cliente, Teléfono, Nivel, Pedidos, Total gastado, Alta, Estado. Cada
fila es un botón de ancho completo, `cursor: pointer`, hover
`rgba(20,16,14,0.03)`.

| Columna | Qué muestra |
|---------|-------------|
| Cliente | Iniciales en un círculo de 32px, nombre y apellido, email debajo en 12px `#6F665A` |
| Teléfono | El teléfono guardado, en mono |
| Nivel | `—` |
| Pedidos | `—` |
| Total gastado | `—` |
| Alta | `created_at` como `dd/mm/aaaa` |
| Estado | Activa si `active` es true. Si no, Bloqueada. Pastillas del artefacto, con el punto de 6px |

Sparks Club e Invitados no matchean ninguna fila: no hay nivel que
filtrar. Bloqueados deja `active = false`. Todos no filtra. La
búsqueda recorta nombre, apellido, email y teléfono, sin distinguir
mayúsculas. Sin cuentas y sin filtro: «Todavía no hay clientes.» Con
filtro o búsqueda que no matchea: «Ningún cliente coincide con la
búsqueda.» Las dos, en Cormorant itálica 22px `#6F665A`. No se siembran
filas.

Si el listado trae 50, una línea dice que se ven los 50 más nuevos.

### Equipo

Sólo el vacío, en la misma itálica: «Todavía no hay miembros del
equipo.» Sin filas, sin select de rol y sin la caja de permisos.

### Cajón

560px, fondo `#F5F1EA`, entra con `slideIn` 0.3s
`cubic-bezier(0.22, 1, 0.36, 1)`. Backdrop `rgba(20,16,14,0.5)`.
Se cierra con × (`cursor: pointer`, 44×44) o con Cancelar. Cancelar
tiene hover de borde `#14100E`. El botón de guardar es fondo `#14100E`
y hover `#8A6B32`. Los dos, `cursor: pointer`.

Alta. Kicker «Nuevo cliente». Título: el nombre escrito, o «Sin
nombre». Guardar dice «Crear cliente». No hay fichas de pedidos ni
zona sensible.

Edición. Kicker «Cliente · alta » más la fecha. Título: nombre y
apellido. Guardar dice «Guardar». Arriba, tres fichas: Pedidos, Total
gastado y Ticket medio, las tres en `—`. Abajo, la zona sensible del
artefacto: el texto, «Bloquear» / «Desbloquear» (hover de borde
`#14100E`) y «Eliminar cuenta» (hover fondo `#B4443A`, texto
`#F5F1EA`).

Campos, en dos grupos:

| Grupo | Campos |
|-------|--------|
| Datos personales | Nombre, Apellido, Email, Teléfono / WhatsApp, Nueva contraseña |
| Cuenta | Nivel, Estado, Notas internas |

La contraseña, en el alta, es obligatoria. En la edición, el hint del
artefacto sigue: «Vacío para mantener la actual.» Nivel y notas se ven
y no se envían. Estado sí: Activa o Bloqueada. «Bloquear» y
«Desbloquear» cambian ese draft; no llaman a la API hasta Guardar.

«Eliminar cuenta» abre el diálogo del artefacto (`fadeUp` 0.22s):
kicker «Acción irreversible», título «¿Eliminar a {nombre} {apellido}?»,
el párrafo de historial y cupones, «Cancelar» y «Sí, eliminar» (fondo
`#B4443A`, hover `#92352D`). El clic en el backdrop cancela. Confirmar
no borra la fila, no la saca del listado, no pone `active` en false y
no muestra «Cliente eliminado». El cajón avisa «Todavía no se puede
eliminar la cuenta.»

Al crear o guardar con éxito, el cajón se cierra y un aviso inferior
(fondo `#14100E`, `fadeUp` 0.25s, 2,2 s) dice «Cliente creado» o
«Cliente actualizado».

Con `prefers-reduced-motion: reduce`, el cajón, el diálogo y el aviso
aparecen sin animación.

## API

`GET /users`, `POST /users` y `PATCH /users/{id}` exigen la misma sesión
que el catálogo: bearer válido y cambio de clave ya hecho. No reemplazan
`POST /auth/register` ni `/me`.

| Método | Cuerpo | Respuesta |
|--------|--------|-----------|
| `GET /users` | — | Lista de `UserPublic`, las más nuevas primero. `limit` 1–100, default 50. Incluye `active = false` |
| `POST /users` | nombre, apellido, email, teléfono, contraseña | 201 `UserPublic` |
| `PATCH /users/{id}` | los mismos, todos opcionales, más `active` | 200 `UserPublic` |

La contraseña cumple la política de 007. En el panel hay un solo campo:
el servidor la valida contra sí misma. Vacía en el `PATCH`, no cambia
el hash. `terms_accepted_at` del alta lo escribe el servidor (la columna
no admite null y el cajón no tiene casilla). `must_change_password`
queda en false. El alta no devuelve token.

409 `email_taken` si el correo existe, también si la fila está inactiva.
404 si el id no está. 401 sin sesión. 422 si falta un dato o la
contraseña no cumple. La respuesta no trae `password` ni
`password_hash`. Crear y corregir escriben auditoría; el payload no
lleva la contraseña. El listado no audita.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como operador veo las cuentas en la tabla de Clientes y la pestaña Equipo vacía |
| US-2 | P0 | Como operador creo un cliente desde el cajón y lo veo en la tabla |
| US-3 | P0 | Como operador abro una fila, corrijo nombre, correo, teléfono o estado, y lo veo guardado |

## Criterios de aceptación

1. `/usuarios` muestra las dos pestañas. Clientes lista lo que devuelve
   `GET /users`: iniciales, nombre, email, teléfono, alta y la pastilla
   Activa o Bloqueada. Nivel, pedidos y total gastado son `—`. Equipo
   muestra el vacío y el conteo `0`, sin los tres nombres de la maqueta
   y sin «Permisos por rol». El menú ya no dice `10` en Usuarios.
2. La fila, las pestañas, los chips, ×, Cancelar, guardar, Bloquear y
   Eliminar cuenta tienen `cursor-pointer`. La fila tiene el hover
   `rgba(20,16,14,0.03)`. Guardar tiene hover `#8A6B32`. Eliminar
   cuenta tiene hover `#B4443A`. El cajón usa `slideIn` y el diálogo
   `fadeUp`, salvo reduced motion.
3. «Nuevo cliente» abre el cajón sobre el listado. Crear llama a
   `POST /users` y no a `POST /auth/register`. Un campo obligatorio
   vacío no llama a la red. 201 cierra el cajón, muestra «Cliente
   creado» y la fila nueva. 409 muestra el detalle y no cierra.
4. El clic en la fila abre el cajón con el nombre, el email, el
   teléfono y el estado de esa cuenta. El kicker dice «Cliente · alta ».
   Guardar llama a `PATCH /users/{id}`. La contraseña vacía no viaja.
   Nivel y notas no viajan. 200 cierra el cajón y muestra «Cliente
   actualizado».
5. «Bloquear» pasa el draft a Bloqueada y no llama a la API. Guardar
   después manda `active: false`. «Desbloquear» y guardar manda
   `active: true`.
6. «Sí, eliminar» no llama a la API. La fila sigue. El cajón muestra
   «Todavía no se puede eliminar la cuenta.» No aparece «Cliente
   eliminado».
7. `GET /users` sin bearer es 401. Con bearer devuelve activas e
   inactivas, sin hash. `POST` sin contraseña es 422 y no inserta.
   `PATCH` de un correo ajeno ya usado es 409 y no cambia la fila. El
   audit de crear o corregir no contiene la contraseña.
8. Un 401 del proxy cierra la sesión y abre `/login` (ADR-0020). `web/`
   no cambia. El bearer no va en la query ni en una cookie.
