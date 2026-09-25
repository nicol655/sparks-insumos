# Plan técnico · 007 API de autenticación y cuenta

- **Estado:** aprobado (2026-09-25, supuestos cerrados)
- **Fecha:** 2026-09-25
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0010](../../decisions/0010-stack-api.md) ·
  [0011](../../decisions/0011-sesion-borrado-logico-y-clave-obligatoria.md)
- **No implementar en este paso.** El siguiente comando es `/tasks`.

## 1 · Enfoque

Tres límites sostienen el plan:

**`api/` nace solo.** No se toca `web/`, ni `contract.ts`, ni `API_MODE`.
El catálogo sigue en el mock (ADR-0003). Esta rebanada es identidad, no
tienda.

**La sesión no es stateless.** Cada request autenticado tiene que leer
`active` y el flag de cambio de contraseña. Logout tiene que invalidar el
token en el servidor. Por eso el bearer es opaco y vive hasheado en
Postgres, no es un JWT. Ver [ADR-0011](../../decisions/0011-sesion-borrado-logico-y-clave-obligatoria.md).

**Docker sigue siendo el entorno.** Pytest (unidad y e2e contra Postgres)
corre dentro del contenedor `api`. El host no necesita Python
([ADR-0004](../../decisions/0004-docker-first.md),
[ADR-0010](../../decisions/0010-stack-api.md)).

El orden de construcción es el de TDD: el test del criterio falla primero,
después el mínimo de código que lo pone verde. `/tasks` parte la secuencia.

## 2 · Stack

Versiones **no** se escriben acá. Se resuelven con el lock del gestor dentro
de la imagen, en la implementación (constitución: no inventar versiones).

| Pieza | Elección | Traza |
|-------|----------|-------|
| Lenguaje | Python 3.12 (imagen oficial) | RF servicio Python |
| HTTP | FastAPI + Uvicorn | Requisito |
| Modelos HTTP | Pydantic v2 (viene con FastAPI) | RNF-3 |
| ORM | SQLAlchemy 2 async + driver `asyncpg` | Requisito «async connection to postgres» |
| Migraciones | Alembic (env async) | RF-4 «primera migración» |
| Base | Postgres 16 (`postgres:16-alpine`) | Requisito |
| Hash de clave | `pwdlib` con Argon2 | RNF-1 · ADR-0011 |
| Tests | pytest + pytest-asyncio + httpx | Requisito TDD y e2e · RNF-5 |
| Lint | Ruff | Gate paralelo al ESLint de `web/` |
| Gestor | `uv` + `uv.lock` | ADR-0010 |
| Docs | `/docs`, `/redoc`, `/openapi.json` de FastAPI | RF-6 · AC-14 |

Paquetes previstos, sin pin en este documento: `fastapi`, `uvicorn`,
`sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `pydantic-settings`,
`pwdlib[argon2]`, `httpx`, `pytest`, `pytest-asyncio`, `ruff`.

## 3 · Estructura de archivos

Convención ya escrita en `architecture.md`: cada servicio trae su
`Dockerfile`, `docker-compose.yml`, `.dockerignore` y `.env.example`.
`docker/` sólo orquesta y no copia Dockerfiles.

```
api/
├── Dockerfile                 # deps · dev (reload + pytest) · runner (no root)
├── docker-compose.yml         # api + db, sin el storefront
├── .dockerignore
├── .env.example
├── pyproject.toml
├── uv.lock                    # generado al implementar, no a mano
├── alembic.ini
├── alembic/
│   ├── env.py                 # async
│   └── versions/0001_users.py # tabla, sesiones y usuario base
├── app/
│   ├── main.py                # FastAPI, /docs, /health
│   ├── config.py              # entorno vía pydantic-settings
│   ├── db.py                  # engine + sesión async
│   ├── models/user.py         # User, Session
│   ├── schemas/auth.py        # cuerpos y respuestas
│   ├── security/passwords.py  # hash, verify, política
│   ├── security/sessions.py   # token opaco, hash sha256
│   ├── api/deps.py            # usuario actual + candado del flag
│   └── api/routes/
│       ├── auth.py
│       └── me.py
└── tests/
    ├── conftest.py            # Postgres de test, migraciones, limpieza
    ├── unit/                  # sin base
    └── e2e/                   # httpx + Postgres real
docker/docker-compose.yml      # suma servicios api y db; web no depende de ellos
```

`GET /health` no está en la spec de producto: existe para el healthcheck de
Compose. Responde 200 sin auth. Entra en la misma suite.

## 4 · Modelo de datos

### `users`

| Columna | Tipo | Nota |
|---------|------|------|
| `id` | uuid PK | |
| `first_name` | varchar(80) | nombres (RF-1) |
| `last_name` | varchar(80) | apellidos |
| `email` | varchar(254) unique | guardado en minúsculas |
| `phone` | varchar(32) | |
| `password_hash` | varchar(255) | Argon2. Nunca el claro |
| `terms_accepted_at` | timestamptz | la aceptación de RF-1. No hay fila si no aceptó |
| `active` | boolean default true | borrado lógico (RF-3) |
| `must_change_password` | boolean default false | RF-5 |
| `created_at` / `updated_at` | timestamptz | |

Índice único sobre `email`. Un correo inactivo sigue ocupando el índice:
el registro responde 409 (AC-3). No se reactiva.

### `sessions`

Hace falta para que logout sea real (ADR-0011). No es un recurso público.

| Columna | Tipo |
|---------|------|
| `id` | uuid PK |
| `user_id` | FK → `users.id` |
| `token_hash` | char(64) unique · SHA-256 del token |
| `expires_at` | timestamptz |
| `revoked_at` | timestamptz null |
| `created_at` | timestamptz |

El token en claro (`secrets.token_urlsafe`) sale una vez en el login. En la
base sólo está el hash.

### Usuario base

La revisión `0001` crea las tablas e inserta el usuario. El hash lo calcula
el mismo módulo que el registro, a partir de
`BOOTSTRAP_ADMIN_PASSWORD` (default local `admin123456`) y
`BOOTSTRAP_ADMIN_EMAIL` (default `admin@sparksinsumos.com`).
`must_change_password = true`, `active = true`. Nombres y teléfono del alta:
`Admin` / `Sparks` / un teléfono placeholder documentado en la migración
(`+540000000000`), porque RF-4 no los pidió y las columnas son NOT NULL.

Ese default vive en `.env.example` y en la interpolación de Compose. Es el
alta local de RF-4, no una clave de producción (RNF-4, ADR-0011).

## 5 · Contrato HTTP

Claves en inglés, igual que `web/src/lib/api/contract.ts`. La spec habla en
español; esta tabla es el mapeo.

| Spec | JSON |
|------|------|
| Nombres | `first_name` |
| Apellidos | `last_name` |
| Correo | `email` |
| Contraseña / repetir | `password` / `password_confirmation` |
| Teléfono | `phone` |
| Aceptar términos | `accept_terms` (tiene que ser `true`) |
| Flag de RF-5 | `must_change_password` |

Errores de dominio, siempre JSON:

```json
{ "code": "password_change_required", "detail": "…" }
```

El 422 de validación se deja el de FastAPI (RNF-3). No se envuelve.

### `POST /auth/register` · público · 201

Cuerpo: `first_name`, `last_name`, `email`, `password`,
`password_confirmation`, `phone`, `accept_terms`.

201: el usuario público (abajo). Sin token.

| Caso | Estado | `code` |
|------|--------|--------|
| Claves distintas, términos no aceptados, política de clave, teléfono | 422 | — |
| Correo ya existente (activo o no) | 409 | `email_taken` |

Política de clave (registro y `POST /auth/change-password`): 8 a 128
caracteres; al menos una mayúscula, una minúscula, un dígito y un carácter
que no sea letra ni número; ningún carácter con `isspace`. Las dos copias
iguales. En el cambio, además, distinta de la actual.

El módulo de hash **no** aplica esta política. Así la migración puede
guardar `admin123456`. Quien elige clave (registro o cambio) sí pasa por
ella, y `admin123456` como clave nueva es 422.

Teléfono (registro, `PATCH /me` y `PUT /me`): `strip`, longitud 6 a 32,
empieza con `+` y tiene al menos un dígito. No se valida un plan de
numeración. El placeholder del usuario base (`+540000000000`) ya cumple.

### `POST /auth/login` · público · 200

```json
{ "email": "ana@example.com", "password": "…" }
```

```json
{
  "access_token": "<opaco>",
  "token_type": "bearer",
  "must_change_password": false
}
```

Contraseña mala, correo desconocido o `active = false`: **401** con el mismo
cuerpo `{ "code": "invalid_credentials", "detail": "Credenciales inválidas" }`
(RNF-2). Un usuario con el flag en true **entra**: 200 y
`"must_change_password": true`.

### `POST /auth/logout` · sesión · 204

Revoca esa sesión (`revoked_at`). Sin cuerpo. Sin token, o token revocado o
vencido: 401 `not_authenticated`. Con el flag en true: 403 (AC-11).

### `POST /auth/change-password` · sesión · 200

Única ruta autenticada que el candado deja pasar.

```json
{ "password": "nueva-clave", "password_confirmation": "nueva-clave" }
```

| Caso | Estado | `code` |
|------|--------|--------|
| Flag en false | 403 | `action_denied` · detalle «Acción denegada» |
| No coinciden, o igual a la actual, o fuera de política | 422 | — |
| Ok | 200 | `{ "must_change_password": false }` |

La misma sesión sigue valiendo. No se pide la clave anterior: la spec sólo
pide la nueva y su repetición, y el endpoint no sirve cuando el flag ya es
false (ahí un token robado no puede pisar la clave).

### `/me` · sesión

Usuario público — es el `GET` y también el alta:

```json
{
  "id": "uuid",
  "first_name": "Ana",
  "last_name": "Pérez",
  "email": "ana@example.com",
  "phone": "+54 9 11 5555 0101",
  "active": true,
  "must_change_password": false,
  "terms_accepted_at": "2026-09-25T12:00:00Z",
  "created_at": "2026-09-25T12:00:00Z",
  "updated_at": "2026-09-25T12:00:00Z"
}
```

Sin `password` y sin `password_hash`.

| Método | Efecto |
|--------|--------|
| `GET` | Ese objeto |
| `PATCH` | Sólo las claves presentes entre `first_name`, `last_name`, `email`, `phone` |
| `PUT` | Esas cuatro, todas obligatorias |
| `DELETE` | 204. `active = false` y se revocan sus sesiones. La fila queda |
| `POST` | 405 |

`extra = forbid` en los cuerpos: no se puede colar `active`,
`must_change_password` ni `password`. Correo repetido en el cambio: 409
`email_taken`.

Esquema de seguridad OpenAPI: HTTP Bearer. En Swagger se pega el
`access_token` del login (RF-6).

### Candado del flag

Dependencia aparte de «hay sesión». La usan logout y `/me`. No la usa
`/auth/change-password`.

Si hay sesión válida, el usuario está activo y `must_change_password` es
true, la respuesta es **403**:

```json
{
  "code": "password_change_required",
  "detail": "El usuario es correcto, pero no tiene permiso para esta acción hasta cambiar la contraseña."
}
```

Orden de la dependencia de sesión:

1. Sin bearer, token desconocido, revocado o vencido → 401 `not_authenticated`.
2. Usuario con `active = false` → 401 `not_authenticated` (el borrado ya
   revocó las sesiones; este chequeo cubre una carrera).
3. Flag en true y la ruta no es el cambio de clave → 403 de arriba.

`DELETE /me` además pone `active = false` y `revoked_at` en todas sus
sesiones, así el token muere aunque alguien saltee el paso 2.

## 6 · Docker

Servicios nuevos en `docker/docker-compose.yml`. **`web` no gana
`depends_on`.** Un `up web` y el gate actual de `web` (`--no-deps`) siguen
iguales.

| Servicio | Imagen / build | Puerto host | Notas |
|----------|----------------|-------------|-------|
| `db` | `postgres:16-alpine` | `${POSTGRES_PORT:-5432}` | Volumen nombrado. Healthcheck `pg_isready` |
| `api` | `api/Dockerfile` target `dev` | `${API_PORT:-8000}` | Bind mount del código. Depende de `db` healthy |

Bases: `sparks` (la app) y `sparks_test` (pytest). El init del contenedor las
crea. La suite no trunca la base de desarrollo.

Variables (`.env.example` de `api/` y de `docker/`; los `.env` siguen
gitignored):

| Variable | Default local |
|----------|----------------|
| `DATABASE_URL` | `postgresql+asyncpg://sparks:sparks@db:5432/sparks` |
| `TEST_DATABASE_URL` | igual, base `sparks_test` |
| `BOOTSTRAP_ADMIN_EMAIL` | `admin@sparksinsumos.com` |
| `BOOTSTRAP_ADMIN_PASSWORD` | `admin123456` |
| `SESSION_TTL_SECONDS` | `21600` (6 horas) |

`api/docker-compose.yml` levanta `api` + `db` para trabajar sin el
storefront. El `Dockerfile` de `api` se referencia, no se duplica.

Etapas del Dockerfile, espejo de `web/`:

| Etapa | Uso |
|-------|-----|
| `deps` | `uv sync` desde el lock |
| `dev` | Uvicorn `--reload` + pytest + ruff. Código por bind mount |
| `runner` | Sin herramientas de test. Usuario no root |

Comandos que el `/tasks` dejará escritos en `stack.md`:

```powershell
docker compose -f docker/docker-compose.yml up db api
docker compose -f docker/docker-compose.yml run --rm api uv run ruff check
docker compose -f docker/docker-compose.yml run --rm api uv run pytest
```

El `run` de pytest **no** lleva `--no-deps`: tiene que arrancar `db`.
Cuando la suite exista, `.cursor/verify.json` suma dos checks (`api-lint`,
`api-test`) sin apagar los de `web`.

## 7 · Trade-offs

| Elección | Por qué | Qué se deja |
|----------|---------|-------------|
| Bearer opaco en `sessions` | Logout real y lectura de `active` / flag en cada request. Una dependencia menos que JWT + lista de revocación | No hay sesión stateless |
| 403 y no 401 para el flag | La identidad ya se acreditó (RF-5). 401 haría pensar que hay que volver a loguearse | Los clientes tienen que mirar `code` |
| El cambio de clave no pide la actual | La spec pide sólo nueva + repetición, y sólo mientras el flag está en true | No hay cambio voluntario |
| Logout bloqueado con el flag | RF-5: cualquier otra acción | En Swagger, el admin no puede cerrar sesión hasta cambiar la clave |
| Correo inactivo no se reutiliza | Único simple y no se «hereda» la fila borrada | Quien se borró no puede volver a registrarse con el mismo correo |
| Hash calculado en la migración vía el módulo de la app | Un solo algoritmo. El claro no queda en la revisión | La migración importa código de `app/` |
| Sin CORS | No hay frontend en esta spec | La spec de conexión con `web/` lo añade |
| Sin rate limit | No está pedido | Login es brute-forceable en esta rebanada. Riesgo aceptado y anotado |

## 8 · Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| `admin123456` queda como default en `.env.example` | Alto si alguien publica eso | Hash en la base, flag que bloquea el sistema, default sólo local, sobrescribible. No hay pipeline de producción en esta spec |
| Token de 6 horas con flag en true | Medio: quien robe el token puede llamar al cambio de clave | Es el diseño pedido (sesión + endpoint sin clave anterior). El default ya es 6 horas y se baja por env si hace falta |
| Alembic async + fixture de pytest | Medio: la suite e2e es lo más fácil de dejar flaky | Una migración por sesión de pytest; cada test borra `sessions` y `users` en `sparks_test` y vuelve a sembrar el admin |
| El gate del repo se alarga al sumar `api-test` | Bajo | Check aparte. `web` sigue con `--no-deps` |
| Puerto 5432 u 8000 ocupado en el host | Bajo | `POSTGRES_PORT` y `API_PORT`, igual que `WEB_PORT` |

## 9 · Estrategia de tests

TDD: cada fila se escribe como test rojo antes del código que la cumple.
Unidad sin base. E2E con httpx `ASGITransport` y Postgres real
(`TEST_DATABASE_URL`). No hay Playwright: la spec prohíbe frontend.

| AC | Dónde |
|----|--------|
| AC-1 | e2e registro 201, claves ausentes en el JSON y en un select del hash |
| AC-2 | unit de la política + e2e 422 sin fila nueva |
| AC-3 | e2e: duplicado activo y duplicado tras `DELETE /me` |
| AC-4 | e2e login 200, esquema bearer |
| AC-5 | e2e: tres casos, mismo cuerpo 401 |
| AC-6 | e2e logout 204 y reuso 401; logout sin header 401 |
| AC-7 | e2e `GET /me` sin `password` ni `password_hash` |
| AC-8 | e2e PATCH parcial y PUT completo |
| AC-9 | e2e DELETE, login posterior 401, `POST /me` 405, fila sigue con `active` false |
| AC-10 | e2e contra la base ya migrada: login del admin con el default |
| AC-11 | e2e: login del admin y 403 en GET/PATCH/PUT/DELETE `/me` y logout, con `code` y el texto |
| AC-12 | e2e: 422 por mismatch, por clave igual y por `admin123456`; luego 200 con una clave válida y `GET /me` 200 |
| AC-13 | e2e: usuario con flag false recibe 403 `action_denied` («Acción denegada») y la clave anterior sigue verificando |
| AC-14 | e2e `GET /docs` y `GET /openapi.json` mencionan las cinco rutas |
| AC-15 | e2e: `password_hash` del admin y de un registro no contiene el claro |

Unidad aparte, antes de los e2e que las usan: hash/verify Argon2, política
de clave (clases, espacios, largo), teléfono con `+`, normalización de
correo, y que el candado distingue 401 de 403.
Esa última puede ser un test de la dependencia con un usuario falso, sin
HTTP, para fallar rápido.

`/health` se afirma en el mismo e2e de AC-14 (200).

## 10 · Qué no se toca

- `web/**`, incluido `contract.ts` y el compose del storefront más allá de
  **añadir** servicios hermanos.
- Checks actuales de `.cursor/verify.json` (se añaden; no se reescriben).
- Roles y permisos (tarea siguiente), mail, CORS, catálogo, pedidos.

## 11 · Handoff

Los supuestos quedaron cerrados en la spec. La lista ejecutable es
[`tasks.md`](./tasks.md). `/implement` toma la primera tarea sin tildar.
