# Tasks · 007 API de autenticación y cuenta

- **Estado:** pendiente
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0010](../../decisions/0010-stack-api.md) ·
  [0011](../../decisions/0011-sesion-borrado-logico-y-clave-obligatoria.md)

Clave válida de los tests: `Sparks1!`. Teléfono válido: `+5491168692694`.
La semilla `admin123456` no cumple la política y sólo entra por la migración.

Cada tarea de comportamiento se escribe en rojo (el test falla) y después
el mínimo de código que la pone verde. No se toca `web/`.

## Setup

- [x] **T250 · Esqueleto del servicio** → RF-7
  `api/` con `pyproject.toml`, lock generado dentro de Docker (no a mano),
  `Dockerfile` (`deps` / `dev` / `runner`), `.dockerignore`, `.env.example`,
  `app/main.py` y `GET /health` → 200.
  Test primero: `api/tests/e2e/test_health.py`.
  Archivos: `api/**` de arriba. Todavía sin Postgres.

- [x] **T251 · Contenedor de Postgres** → RF-7, AC-14 (infra)
  Servicios `db` y `api` en `docker/docker-compose.yml` y
  `api/docker-compose.yml`. `web` no gana `depends_on`. Puertos
  `API_PORT` y `POSTGRES_PORT`. Bases `sparks` y `sparks_test`.
  Healthcheck de `db`. Variables de `.env.example` (TTL `21600`,
  admin `admin@sparksinsumos.com` / `admin123456`).
  Archivos: `docker/docker-compose.yml`, `docker/.env.example`,
  `api/docker-compose.yml`, `api/.env.example`.

## Foundational

- [x] **T252 · Config y sesión async** → RF-7
  `app/config.py` (pydantic-settings) y `app/db.py` (engine + sesión async).
  Test primero: `api/tests/unit/test_config.py` afirma el default de 6 horas
  y el correo semilla.
  Archivos: `api/app/config.py`, `api/app/db.py`, `api/tests/unit/test_config.py`.

- [x] **T253 · Política de contraseña** `[P]` → RF-1, RF-5, AC-2, AC-12, AC-15
  Test primero: `api/tests/unit/test_passwords.py`.
  Acepta `Sparks1!`. Rechaza sin mayúscula, sin minúscula, sin número, sin
  especial, con espacio, con menos de 8 y con más de 128. Hash Argon2 y
  verify. El hash no contiene el claro. Esta función no se llama al sembrar
  `admin123456`.
  Archivos: `api/tests/unit/test_passwords.py`, `api/app/security/passwords.py`.

- [x] **T254 · Correo y teléfono** `[P]` → RF-1, RF-2, AC-2
  Test primero: `api/tests/unit/test_identifiers.py`.
  Correo a minúsculas y sin bordes. Teléfono recortado, 6–32, empieza con
  `+`, al menos un dígito. `5491168692694` y `+123` fallan.
  Archivos: `api/tests/unit/test_identifiers.py`, `api/app/security/identifiers.py`.

- [x] **T255 · Migración y usuario base** → RF-4, AC-10, AC-15
  Modelos `User` y `Session`. Alembic async. Revisión `0001` crea tablas e
  inserta el admin con hash de `admin123456`, `active = true`,
  `must_change_password = true`, teléfono `+540000000000`.
  Test primero: `api/tests/e2e/test_bootstrap.py` (login del admin todavía
  puede esperar a T257; aquí basta un select: fila presente, hash ≠ claro,
  flag true). Fixture de `conftest.py`: migrar `sparks_test` una vez por
  sesión y limpiar entre tests, reponiendo el admin.
  Archivos: `api/app/models/user.py`, `api/alembic/**`, `api/alembic.ini`,
  `api/tests/conftest.py`, `api/tests/e2e/test_bootstrap.py`.

## US-1 · Registro

- [x] **T256 · `POST /auth/register`** → US-1, RF-1, AC-1, AC-2, AC-3
  Test primero: `api/tests/e2e/test_register.py`.
  201 sin auth y sin contraseña ni hash en el JSON. 422 por política, por
  claves distintas, por términos no aceptados y por teléfono sin `+`.
  409 `email_taken` si el correo ya existe (el caso inactivo se completa en
  T261). No abre sesión.
  Archivos: `api/tests/e2e/test_register.py`, `api/app/schemas/auth.py`,
  `api/app/api/routes/auth.py`, `api/app/main.py`.

## US-2 · Login y logout

- [x] **T257 · `POST /auth/login`** → US-2, RF-2, AC-4, AC-5
  Test primero: `api/tests/e2e/test_login.py`.
  200 con bearer y `must_change_password`. 401 idéntico para clave mala,
  correo desconocido y `active = false` (la fila inactiva se inserta en el
  test, sin pasar por `DELETE`). Crea fila en `sessions`; en la base sólo
  está el hash del token.
  Archivos: `api/tests/e2e/test_login.py`, `api/app/security/sessions.py`,
  `api/app/api/routes/auth.py`.

- [x] **T258 · `POST /auth/logout`** → US-2, RF-2, AC-6
  Test primero: `api/tests/e2e/test_logout.py`.
  Con flag en false: 204, revoca la sesión, el mismo token después es 401.
  Sin token: 401. Token con `expires_at` en el pasado: 401. El 403 del admin
  (flag true) es T262, no este.
  Archivos: `api/tests/e2e/test_logout.py`, `api/app/api/deps.py`,
  `api/app/api/routes/auth.py`.

## US-3 · Cuenta propia

- [x] **T259 · `GET /me`** → US-3, RF-3, AC-7
  Test primero: `api/tests/e2e/test_me.py`.
  Usuario con flag false. 200 con todos los campos públicos y sin
  `password` ni `password_hash`. Sin token: 401.
  Archivos: `api/tests/e2e/test_me.py`, `api/app/api/routes/me.py`.

- [x] **T260 · `PATCH /me` y `PUT /me`** → US-3, RF-3, AC-8
  Mismos tests. `PATCH` cambia sólo lo enviado. `PUT` exige
  `first_name`, `last_name`, `email`, `phone`. Teléfono y correo se
  revalidan. Cuerpo con `active`, `password` o `must_change_password`: 422.
  Correo ajeno: 409 `email_taken`.
  Archivos: `api/tests/e2e/test_me.py`, `api/app/schemas/auth.py`,
  `api/app/api/routes/me.py`.

- [x] **T261 · `DELETE /me`** → US-3, RF-2, RF-3, AC-3, AC-9
  `DELETE` → 204, `active = false`, sesiones revocadas, la fila sigue.
  Login posterior: 401 de AC-5. `POST /me` → 405. Registrar el mismo correo
  → 409.
  Archivos: `api/tests/e2e/test_me.py`, `api/tests/e2e/test_register.py`,
  `api/app/api/routes/me.py`.

## US-4 · Cambio obligatorio

- [x] **T262 · Candado del flag** → US-4, RF-5, AC-10, AC-11
  Test primero: `api/tests/e2e/test_password_gate.py` y, si cabe sin HTTP,
  `api/tests/unit/test_password_gate.py`.
  Login `admin@sparksinsumos.com` / `admin123456` → 200 y flag true.
  Con ese token, `GET` / `PATCH` / `PUT` / `DELETE /me` y logout → 403
  `password_change_required` y el texto de que el usuario es correcto pero
  no tiene permiso hasta cambiar la contraseña.
  Archivos: `api/tests/e2e/test_password_gate.py`, `api/app/api/deps.py`,
  rutas de `me` y `logout`.

- [x] **T263 · `POST /auth/change-password`** → US-4, RF-5, AC-12, AC-13
  Test primero: `api/tests/e2e/test_change_password.py`.
  Con flag true: 422 si no coinciden, si es igual a la actual, si no cumple
  la política o si la nueva es `admin123456`. Con `Sparks1!` repetida: 200,
  flag false, y el mismo token ya hace `GET /me`.
  Con flag false: 403 `action_denied`, detalle «Acción denegada», hash
  intacto.
  Archivos: `api/tests/e2e/test_change_password.py`,
  `api/app/api/routes/auth.py`.

## US-5 · Swagger

- [x] **T264 · OpenAPI** → US-5, RF-6, AC-14, AC-15
  Test primero: `api/tests/e2e/test_openapi.py`.
  `GET /docs` y `GET /openapi.json` → 200 y nombran `/auth/register`,
  `/auth/login`, `/auth/logout`, `/auth/change-password` y `/me`.
  El esquema de seguridad es HTTP Bearer. AC-15 queda cubierto por T253,
  T255 y T256; este test no lo duplica salvo un assert que ya exista en rojo.
  Archivos: `api/tests/e2e/test_openapi.py`, `api/app/main.py`.

## Polish

- [x] **T265 · Gate** → RNF-5, RF-7
  `.cursor/verify.json` suma `api-lint` (`ruff`) y `api-test` (`pytest`,
  con `db`, sin `--no-deps`). No se apagan los checks de `web`.
  `stack.md` documenta los comandos. ADR 0010 y 0011 pasan a `accepted`.
  `progress.md` queda con el estado y el paso siguiente.
  Archivos: `.cursor/verify.json`, `.ai/stack.md`, `.ai/progress.md`,
  `.ai/decisions/0010-stack-api.md`, `.ai/decisions/0011-sesion-borrado-logico-y-clave-obligatoria.md`.

## Dependencias

```
T250 → T251 → T252 → T255 → T256 → T257 → T258 → T259 → T260 → T261 → T262 → T263 → T264 → T265
                  ↘ T253 [P] ↗
                  ↘ T254 [P] ↗
```

T253 y T254 pueden ir en paralelo después de T252 (no usan la base).
T255 las necesita antes de registrar o sembrar. T256–T264 son una cadena:
cada una usa la sesión o la ruta de la anterior.

## Definition of Done

- T250–T265 tildadas.
- AC-1…AC-15 verdes en pytest, dentro de Docker, contra Postgres real.
- `/verify` verde (web + api).
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- `web/` sin cambios de producto. Roles, sin implementar.
