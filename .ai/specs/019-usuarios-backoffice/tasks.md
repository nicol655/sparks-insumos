# Tasks · 019 Usuarios del backoffice

- **Estado:** cerrada (T367–T373)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0026](../../decisions/0026-usuarios-del-panel-sin-datos-inventados.md)

`web/` no se toca. Pytest de la API corre contra Postgres. Vitest del
backoffice corre con `--no-deps`. Cada tarea de comportamiento se
escribe en rojo y después el mínimo de código que la pone verde.
`get_authenticated` ya relee `active` en cada request: bloquear no
revoca sesiones.

## Foundational

- [x] **T367 · API de cuentas** → AC-7
  `api/app/schemas/auth.py`: `UserCreate` y `UserAdminPatch`.
  `api/app/api/routes/users.py`: `GET /users`, `POST /users`,
  `PATCH /users/{id}`. `api/app/main.py` incluye el router.
  Listado más nuevo primero, límite 50, incluye inactivas, sin hash.
  Alta con la política de 007, `terms_accepted_at` del servidor,
  `must_change_password` en false, sin token. PATCH con contraseña
  vacía no cambia el hash. 409 de correo repetido, también inactivo.
  Auditoría en crear y corregir, sin la contraseña. El GET no audita.
  Test primero en `api/tests/e2e/test_users_admin.py`.

- [x] **T368 · Proxy** `[P]` → AC-8
  No depende de T367. Puede ir en paralelo.
  `backoffice/src/lib/users/proxy.ts`, `app/api/users/route.ts` y
  `app/api/users/[id]/route.ts`. GET y POST a `/users`. PATCH sólo
  con uuid; si no, 404 y sin fetch. Bearer por `Authorization` o
  `x-sparks-token`. Sin bearer, 401 y sin fetch.
  Test primero en `backoffice/src/lib/users/__tests__/proxy.test.ts`.

## US-1 · US-2 · US-3 · Panel

- [x] **T369 · Cliente y validación** → AC-3, AC-4
  Depende de T368 para el camino real. El cliente se prueba con fetch
  falso.
  `backoffice/src/lib/users/contract.ts`, `client.ts`, `form.ts`.
  `listUsers`, `createUser`, `updateUser`. Un campo vacío no arma
  cuerpo. En el alta, la contraseña vacía es «Completá la contraseña.»
  Tests en `__tests__/client.test.ts` y `__tests__/form.test.ts`.

- [x] **T370 · Tabla y pestañas** → US-1, AC-1, AC-2
  Depende de T369.
  `backoffice/src/components/users/users-screen.tsx`.
  `backoffice/src/app/(panel)/usuarios/page.tsx` monta la pantalla.
  `backoffice/src/content/nav.ts` deja Usuarios sin `count`.
  Pestañas Clientes y Equipo. Equipo vacío, conteo 0, sin la matriz.
  Filas con iniciales, nombre, email, teléfono, alta y pastilla.
  Nivel, pedidos y gasto en `—`. Hover y `cursor-pointer` en la fila.
  Chips: Club e Invitados no dejan filas; Bloqueados deja
  `active = false`. 401 cierra la sesión.
  Test primero en `users-screen.test.tsx`. Ajustar
  `panel.test.ts`, `shell.test.tsx` y `section-title.test.tsx`.

- [x] **T371 · Cajón de alta** → US-2, AC-2, AC-3
  Depende de T370.
  `backoffice/src/components/users/user-drawer.tsx` y
  `backoffice/src/app/globals.css` (`slideIn`, `fadeUp`).
  «Nuevo cliente», título «Sin nombre» hasta que haya nombre, botón
  «Crear cliente» con hover oro. Vacío no llama a `createUser`. 201
  cierra, avisa «Cliente creado» y muestra la fila. 409 deja el cajón
  y el detalle. × y Cancelar cierran. `motion-reduce:animate-none`.

- [x] **T372 · Cajón de edición** → US-3, AC-2, AC-4, AC-5, AC-6
  Depende de T371.
  Clic en la fila: kicker «Cliente · alta », fichas en `—`, datos de
  la cuenta. Guardar hace `PATCH` sin contraseña vacía y sin nivel ni
  notas. «Bloquear» sólo cambia el draft; Guardar manda
  `active: false`. «Desbloquear» y Guardar manda `active: true`.
  «Sí, eliminar» no llama a la API, la fila sigue y el cajón avisa
  que no se puede eliminar. Hover de Eliminar cuenta en `#B4443A`.
  Aviso «Cliente actualizado».

## Polish

- [x] **T373 · Verify y handoff**
  Depende de T367–T372.
  `docker compose -f docker/docker-compose.yml run --rm api uv run pytest`
  y `docker compose -f docker/docker-compose.yml run --rm --no-deps backoffice npm run verify`.
  Ruff del API. Arreglar la causa. Tildar esta lista. `plan.md` pasa a
  implementado. `architecture.md`, `glossary.md` y `progress.md` dicen
  que `/usuarios` lista y edita cuentas, y que Equipo sigue vacío.
  `web/` sin cambios.

## Dependencias

```
T367 ──────────────┐
T368 [P] ──→ T369 ─┼──→ T370 ──→ T371 ──→ T372 ──→ T373
```

## Definition of Done

- T367–T373 tildadas.
- AC-1…AC-8 cubiertos por pytest (Postgres) y por Vitest del backoffice
  (`--no-deps`).
- `pytest` del API y `npm run verify` del backoffice en verde.
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- `web/` sin cambios. El bearer no va en la query ni en una cookie.
