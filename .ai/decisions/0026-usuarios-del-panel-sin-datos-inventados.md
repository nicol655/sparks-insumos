# ADR 0026: Usuarios del panel lista cuentas reales y deja Equipo vacío

- **Status:** accepted
- **Date:** 2026-09-30
- **Deciders:** producto (pedido de `/plan` de 019)

## Context

El artefacto `NtzZJG94zfZrj3LpMvAtS9` es la única fuente visual del
backoffice (constitución 17). En Usuarios dibuja dos pestañas, una
tabla (nivel, pedidos, gasto, alta, estado), un cajón de alta y uno de
edición con notas, bloqueo y borrado. También dibuja un equipo de
ejemplo y la matriz de roles.

`users` guarda nombre, apellido, email, teléfono, hash, `active`,
`must_change_password` y las fechas. No hay nivel, notas, pedidos ni
rol. No hay `GET /users` ni un alta hecha por el operador: `POST
/auth/register` es público y `/me` sólo toca la sesión propia.
`audits.user_id` no se puede borrar en cascada. `active = false` ya
significa que la fila sigue, el login falla y el correo no se puede
volver a registrar (007).

El pedido de esta pasada pide las dos pestañas, la tabla y los dos
cajones, y deja Equipo vacío hasta otra tarea.

## Decision

- La pantalla lista, crea y corrige filas de `users` con
  `GET /users`, `POST /users` y `PATCH /users/{id}`, autenticados.
  No usa el registro público ni `/me`.
- La pestaña Equipo se muestra y no tiene filas, invitación ni matriz.
  El conteo es 0. No se siembran los tres miembros de la maqueta.
- Nivel, pedidos, total gastado y ticket se ven como `—`. El histórico
  del resumen también. «0 socios del club» es el recuento real. Notas
  y el select de nivel están en el cajón y no viajan en el JSON.
- Estado Activa / Bloqueada es `active`. Bloquear cambia el draft;
  Guardar lo persiste.
- «Eliminar cuenta» abre el diálogo con el texto del artefacto.
  Confirmar no borra la fila ni la desactiva. El cajón dice que todavía
  no se puede eliminar.
- El `10` del menú sale. Era relleno.

## Alternatives considered

- **Pintar la maqueta.** Publicaría clientes, socios y un equipo que no
  existen. Lo prohíbe ADR-0015.
- **Esperar a tener roles, pedidos y nivel.** La tabla y los cajones
  que sí se pueden llenar con `users` seguirían en el título.
- **Reusar `POST /auth/register`.** No prueba que quien crea es el
  operador, y el alta del panel no pide repetir la contraseña ni
  aceptar términos en pantalla.
- **Borrar la fila al confirmar.** Choca con la FK de `audits` y con el
  significado de `active` en 007. No hay historial de pedidos que
  borrar.
- **Ocultar Equipo.** El pedido pide la pestaña, vacía.

## Consequences

- Un operador puede elegir Sparks Club o escribir una nota y, al
  guardar, eso no queda. La tabla sigue en `—`.
- El diálogo de eliminar describe un borrado que esta rebanada no
  ejecuta. El aviso de después es el que vale.
- La constitución 14 sigue en deuda: esta API no distingue
  Administración de una cuenta de la tienda.
- Roles, invitación y el borrado real quedan para otra spec.
