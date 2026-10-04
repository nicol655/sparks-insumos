# Plan técnico · 012 Auditoría de acciones

- **Estado:** implementado (2026-09-28)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0017](../../decisions/0017-auditoria-opt-in-y-contexto.md).
  Reusa [0010](../../decisions/0010-stack-api.md) (FastAPI, SQLAlchemy
  async, Alembic, pytest en Docker) y la guarda de
  [007](../007-api-autenticacion/spec.md) (`require_password_changed`).

## 1 · Enfoque

Tres piezas, sin tocar las rutas de cuenta:

1. `ContextVar` de sesión y de `user_id`, escritas por las dependencias
   que ya existen y limpiadas en el `finally`.
2. Decorator `audited` que, tras un retorno, inserta en `audits` con
   esos valores.
3. `GET /audits` y `GET /audits/{id}` con el DTO de salida.

El decorator no se aplica a ningún endpoint actual. Los tests de
escritura llaman a una función de prueba decorada, con el contexto
armado a mano y la sesión de `sparks_test`.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `api/alembic/versions/0002_audits.py` | Tabla `audits` e índice por `created_at` |
| `api/app/models/audit.py` | Modelo `Audit` |
| `api/app/models/__init__.py` | Exporta `Audit` |
| `api/app/request_context.py` | `ContextVar` de sesión y de actor, con set/reset |
| `api/app/db.py` | `get_session` publica la sesión en el contexto y la retira en el `finally` |
| `api/app/api/deps.py` | `get_authenticated` pasa a yield: publica `user.id` y lo retira al cerrar el request |
| `api/app/audit.py` | `audited`, validación de `action` / `resource` / payload, insert |
| `api/app/schemas/audit.py` | `AuditPublic` |
| `api/app/api/routes/audits.py` | Los dos GET |
| `api/app/main.py` | Incluye el router |
| `api/tests/conftest.py` | `_reset` borra `audits` antes de `sessions` y `users` |
| `api/tests/unit/test_audit.py` | AC-2…AC-6 |
| `api/tests/e2e/test_audits.py` | AC-7, AC-8, AC-10 |
| `api/tests/e2e/test_openapi.py` | AC-9, sumar los dos paths |

`web/` y `backoffice/` no se editan. No hay dependencia nueva.

## 3 · Tabla

`0002`, `down_revision = "0001"`.

```text
audits
  id           uuid pk
  user_id      uuid not null  → users.id   ON DELETE RESTRICT
  action       varchar(64) not null
  resource     varchar(64) null
  payload      jsonb null
  created_at   timestamptz not null default now()
índice (created_at desc)
```

Sin `updated_at`. El modelo SQLAlchemy no tiene relación inversa que
obligue a cargar el usuario para leer el DTO: `user_id` es columna.

`_reset` ejecuta `DELETE FROM audits` antes de `sessions` y `users`.
Sin eso, el primer test que inserte una fila rompe el `DELETE FROM users`
del resto de la suite.

## 4 · Contexto del request

`app/request_context.py` expone:

- `set_session(session) -> token` y `reset_session(token)`
- `set_actor(user_id) -> token` y `reset_actor(token)`
- `current_session()` y `current_actor_id()`, o `None`

`get_session` hace `set_session` antes del `yield` y `reset_session` en
el `finally`, después del rollback si hubo excepción. La firma sigue
siendo un generador; las rutas no cambian.

`get_authenticated` pasa de `return` a `yield`. FastAPI entrega el mismo
`Authenticated` a `require_password_changed` y a las rutas. El `finally`
hace `reset_actor`. Ningún test llama a `get_authenticated` directo
(sólo vía HTTP), así que el cambio de generador no rompe la suite
actual.

## 5 · Decorator

```text
def audited(
    action: str,
    resource: str | None = None,
    payload: Callable[..., Mapping | None] | None = None,
) -> Callable
```

`functools.wraps`, para que FastAPI siga leyendo la firma de la ruta
(`inspect.signature` sigue `__wrapped__`).

Orden obligatorio, documentado en el docstring: el decorator de la ruta
(`@router.get`) queda encima de `@audited`.

Flujo:

1. Validar `action` y `resource` al decorar (regex `^[a-z0-9_]{1,64}$`).
   `resource` vacío se trata como null. Un token inválido falla al
   importar la ruta, no en cada request.
2. Ejecutar la función. Si lanza, propagar y no insertar (AC-6).
3. Si hay `payload`, llamarla con `*args`, `**kwargs` y `result=<retorno>`.
   Las rutas no pueden nombrar un parámetro `result`.
4. Recorrer el objeto. Si aparece una clave prohibida
   (`password`, `password_confirmation`, `password_hash`,
   `access_token`, `token`), lanzar `DomainError(400, "audit_payload_rejected", …)`
   y no insertar (AC-4).
5. Exigir `current_actor_id()` y `current_session()`. Si falta el actor,
   `DomainError(401, "not_authenticated", …)` y no insertar (AC-3).
6. `session.add(Audit(...))` y `await session.commit()`. `created_at`
   lo pone la base. `user_id` es el del contexto, nunca un argumento.

El payload tiene que ser JSON (`dict` / `list` / escalares / null).
Otra cosa falla con el mismo 400, sin insertar. No hay encoder que
convierta un modelo con la contraseña adentro.

## 6 · Lectura

`AuditPublic` con `from_attributes` y los seis campos del DTO. Sin
`model_dump` de más.

`GET /audits`: `require_password_changed`, `order_by(created_at.desc(), id.desc())`,
`limit` query, default 50. `Query(ge=1, le=100)`. Por encima de 100,
422 de FastAPI (AC-8). Respuesta: lista, no un sobre.

`GET /audits/{audit_id}`: el mismo permiso. `scalar` por id. Si no hay
fila, `DomainError(404, "not_found", "No existe ese registro de auditoría.")`.

Tag OpenAPI: `audits`. Sin `response_model` de escritura porque no hay
esos métodos.

## 7 · Tests

La suite de `api` ya corre en Docker (`api-test` levanta `db`). No se
agrega un check a `verify.json`.

| AC | Dónde |
|----|--------|
| AC-1 | `test_audit.py` inspecciona las columnas en `sparks_test` después de `upgrade head`, o inserta una fila con `resource` y `payload` null y la lee |
| AC-2, AC-5 | Función async decorada, contexto con un usuario de prueba y `SessionLocal`. Assert de la fila |
| AC-3 | La misma función sin `set_actor`. Cero filas y error |
| AC-4 | `payload` devuelve `{"target_user_id": "…"}` y eso se guarda. Otra llamada devuelve `{"nested": {"password": "secreta"}}`: cero filas nuevas y el texto `secreta` no está en `audits.payload` |
| AC-6 | La función lanza `RuntimeError`. Cero filas |
| AC-7, AC-8 | `test_audits.py` con httpx, como el resto de e2e. Se inserta una fila con el ORM (no hay POST). Login de una cuenta con la contraseña ya cambiada. El admin semilla sigue en 403 |
| AC-9 | `test_openapi.py` suma `/audits` y `/audits/{audit_id}` y afirma que sus métodos son sólo `get` |
| AC-10 | Tras `POST /auth/login` y `GET /me`, `SELECT count(*) FROM audits` es 0 |

El unitario de AC-2 no levanta la app. Usa la fixture de engine que ya
migra `sparks_test`. Hoy esa fixture no limpia sola a los tests fuera de
`e2e`; el test de audit pide `db_engine` y borra `audits` al final para
no dejar la FK ocupada.

## 8 · Trade-offs

- **Segundo commit.** La ruta puede haber confirmado ya su cambio. El
  audit se confirma después. Si ese commit falla, la acción quedó y la
  fila no. ADR-0017 lo deja así para no reescribir 007.
- **Lectura abierta a cualquier cuenta lista.** El pedido dice
  «autenticados». 007 no tiene rol. Cerrar el GET a un admin sería
  inventar el rol.
- **`limit` máximo 100.** «GET all» sin tope vacía la tabla en una
  respuesta. El default 50 y el máximo 100 están en la spec para que
  el test pueda afirmar el 422.
- **`get_authenticated` como generador.** Es el único modo de limpiar
  el `ContextVar` al final del request, igual que `get_session`.

## 9 · Riesgos

- Un payload que esconde la clave bajo un nombre que no está en la
  lista (`new_secret`) sí se guardaría. La lista cubre los nombres que
  el ejemplo y el esquema de 007 ya usan. Una spec que mande otro
  secreto tiene que omitirlo en su función `payload`.
- Entre el commit de la ruta y el del audit puede no haber fila. La
  spec de cada acción futura puede exigir el commit único si le importa.
- `DELETE FROM users` en `_reset` falla si se olvida el `DELETE FROM
  audits`. El plan lo incluye en el mismo cambio que la migración.

## 10 · Constitución

| Principio | Cómo se cumple |
|-----------|----------------|
| 6 | El payload no se infiere del body. Las claves de contraseña y token rechazan la escritura |
| 14 | No se crea un rol para leer el audit. La spec lo deja escrito |
| 1–5, 7 | Spec y ADR antes del código. Sin dependencia nueva. Mismo FastAPI y la misma guarda de 007 |
