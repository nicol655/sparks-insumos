# Tasks · 012 Auditoría de acciones

- **Estado:** cerrada (T319–T324)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0017](../../decisions/0017-auditoria-opt-in-y-contexto.md)

No se toca `web/` ni `backoffice/`. No se decora ninguna ruta de 007.
Cada tarea de comportamiento se escribe en rojo y después el mínimo
de código que la pone verde. Pytest corre en Docker contra `sparks_test`.

## Setup

- [x] **T319 · Tabla `audits`** → AC-1, RNF-3
  Migración `api/alembic/versions/0002_audits.py` (`down_revision = "0001"`):
  `id` uuid pk, `user_id` uuid not null FK `users.id` ON DELETE RESTRICT,
  `action` varchar(64) not null, `resource` varchar(64) null,
  `payload` jsonb null, `created_at` timestamptz not null default now().
  Índice por `created_at`. Sin `updated_at`.
  Modelo `api/app/models/audit.py` y export en `models/__init__.py`.
  `tests/conftest.py`: `_reset` hace `DELETE FROM audits` antes de
  `sessions` y `users`.
  Test primero en `api/tests/unit/test_audit.py`: insertar con
  `resource` y `payload` null y leerlos; un `user_id` inexistente no
  entra (FK).

## Foundational

- [x] **T320 · Contexto del request** `[P]` → sección Escritura, ADR-0017
  Puede ir en paralelo con T319.
  `api/app/request_context.py`: `set_session` / `reset_session`,
  `set_actor` / `reset_actor`, `current_session`, `current_actor_id`.
  `api/app/db.py`: `get_session` publica la sesión y la retira en el
  `finally`, después del rollback si hubo error.
  `api/app/api/deps.py`: `get_authenticated` hace yield, publica
  `user.id` y lo retira al cerrar. Si rechaza antes, no deja actor.
  Test en `api/tests/unit/test_request_context.py`: set/reset vuelve
  a `None`, y un set anidado no pisa el valor exterior al salir.

## US-1 · Escritura

- [x] **T321 · Decorator `audited`** → US-1, AC-2…AC-6, RNF-2
  Depende de T319 y T320.
  Test primero, en `api/tests/unit/test_audit.py`, con `db_engine` y
  `SessionLocal` de `sparks_test`:
  - Con actor y sesión, después de un retorno quedan `user_id`,
    `action`, `resource`, `payload` y `created_at`.
  - Sin `payload` ni `resource`, esas columnas son null.
  - Sin actor, no hay fila y la llamada falla con 401.
  - `payload` custom `{"target_user_id": "…"}` se guarda. Un objeto con
    `password` anidada no se guarda y `secreta` no aparece en la tabla.
  - Si la función lanza, no hay fila.
  - Un `action` inválido falla al decorar.
  Código: `api/app/audit.py`. Valida el token al decorar. Inserta y
  hace commit sólo tras el retorno. Rechaza las claves
  `password`, `password_confirmation`, `password_hash`, `access_token`
  y `token` a cualquier nivel. El payload guardado es un objeto o null.

## US-2 · Lectura

- [x] **T322 · GET autenticados** → US-2, AC-7, AC-8, AC-10
  Depende de T319. Puede ir en paralelo con T321 una vez que existe
  el modelo.
  DTO `api/app/schemas/audit.py`: `id`, `user_id`, `action`,
  `resource`, `payload`, `created_at`.
  `api/app/api/routes/audits.py`: `GET /audits` (default 50, máximo
  100, más nueva primero) y `GET /audits/{audit_id}` (404
  `not_found` con el texto de la spec). Guardia
  `require_password_changed`. `main.py` incluye el router.
  Test primero: `api/tests/e2e/test_audits.py`.
  Sin bearer, 401. Admin semilla, 403. Cuenta registrada: lista vacía,
  luego dos filas insertadas por ORM (no hay POST) en orden
  descendente, `limit=1` devuelve la más nueva, un id desconocido es
  404, `limit=101` es 422.
  Tras registro, login, `GET /me`, logout y `POST /auth/change-password`
  del admin, `audits` sigue en cero.

- [x] **T323 · OpenAPI** `[P]` → AC-9
  Puede ir junto a T322.
  `api/tests/e2e/test_openapi.py`: `/audits` y `/audits/{audit_id}`
  están en el documento y sus únicos métodos son `get`.

## Polish

- [x] **T324 · Verify y handoff** → RNF-1
  Depende de T320–T323.
  `docker compose -f docker/docker-compose.yml run --rm --no-deps api uv run ruff check`
  y `docker compose -f docker/docker-compose.yml run --rm api uv run pytest`.
  Arreglar la causa. Tildar esta lista. `architecture.md` y el glosario
  dejan de decir que el audit no está construido. `progress.md`: estado
  y el paso siguiente (enganchar el decorator en una acción concreta
  sigue fuera).

## Dependencias

```
T319 ─────────────→ T321 (US-1) ─┐
T320 [P] ─────────→ T321         ├→ T324
T319 ─────────────→ T322 (US-2) ─┤
                   → T323 [P] ───┘
```

T320 puede ir con T319. T322 y T323 pueden ir con T321 en cuanto la
tabla existe. T324 cierra.

## Definition of Done

- T319–T324 tildadas.
- AC-1…AC-10 cubiertos por pytest contra `sparks_test`.
- `ruff check` y `pytest` de `api` en verde, dentro de Docker.
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- `web/` y `backoffice/` sin cambios. Ninguna ruta de 007 llama a
  `audited`.
