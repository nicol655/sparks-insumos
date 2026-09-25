# ADR 0010: Stack del servicio `api`

- **Status:** accepted
- **Date:** 2026-09-25
- **Deciders:** Nico + agente

## Context

La spec [007](../specs/007-api-autenticacion/spec.md) pide el primer backend:
Python, FastAPI, pytest (TDD y e2e), SQLAlchemy con conexión async a Postgres,
y dos contenedores nuevos (API y base). ADR-0004 ya obliga a que el desarrollo
y el gate corran en Docker, sin herramientas instaladas en el host. ADR-0001
fijó el stack de `web/` y dejó `api/` sin elegir.

Hay que cerrar lo que la spec no nombra: versión mayor de Python y de
Postgres, gestor de paquetes, driver async, herramienta de migraciones y
linter. Las versiones concretas de las librerías no se inventan en el plan:
las fija el lock al implementar.

## Decision

- Servicio en `api/`, imagen oficial **Python 3.12**, **Postgres 16**
  (`postgres:16-alpine`).
- **FastAPI + Uvicorn**, modelos con Pydantic, ORM **SQLAlchemy 2 asyncio**
  y driver **asyncpg**.
- Migraciones con **Alembic** en modo async. La primera revisión crea el
  esquema de cuentas y el usuario base (RF-4).
- Dependencias con **uv** y `uv.lock`, generados dentro del contenedor.
- Tests con **pytest**, **pytest-asyncio** y **httpx** contra la app y contra
  la base `sparks_test`. Lint con **Ruff**.
- El `Dockerfile` es multi-etapa (`deps`, `dev`, `runner`), análogo al de
  `web/`. `docker/docker-compose.yml` referencia ese Dockerfile y añade el
  servicio `db`. `web` no depende de ninguno de los dos.
- Cuando la suite exista, `.cursor/verify.json` suma lint y pytest de `api`
  sin quitar los checks de `web`.

## Alternatives considered

- **pip + `requirements.txt` a mano.** Menos piezas, y también más fácil de
  desbloquear una versión «a ojo», que es lo que la constitución prohíbe.
  uv deja un lock y corre igual de bien dentro de Docker.
- **Poetry.** Otro lockfile válido. uv es más chico en la imagen y alcanza
  para instalar, lockear y lanzar pytest.
- **psycopg async en vez de asyncpg.** También sirve. asyncpg es el driver
  que SQLAlchemy documenta para el dialecto `postgresql+asyncpg` y no añade
  un segundo estilo de API.
- **Node o el route handler de Next como API.** Contradice el servicio propio
  en su contenedor (ADR-0003 y ADR-0004) y la spec.
- **Python 3.13 o Postgres 17.** Más nuevos, sin necesidad de esta rebanada.
  3.12 y 16 son las líneas estables que el equipo puede fijar hoy.

## Consequences

- El host sigue necesitando sólo Docker.
- Hay un segundo ciclo de imagen (la de `api`) además de la de `web`.
- El check de pytest de `api` arranca Postgres; no puede usar `--no-deps`.
- Quien implemente corre `uv lock` dentro del contenedor y commitea el lock.
  No se escriben números de versión en la spec ni en el plan.
