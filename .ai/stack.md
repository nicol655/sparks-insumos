# Stack & Commands

Todo corre en Docker. **No hace falta Node, npm ni navegadores instalados en el host** — sólo
Docker. Ver [ADR-0004](./decisions/0004-docker-first.md).

## Stack

### `web/` — storefront

| Pieza | Versión | Nota |
|-------|---------|------|
| Next.js | 16.3.5 | App Router, Turbopack, `output: 'standalone'` |
| React | 19.2.8 | |
| TypeScript | 5.x | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch` |
| Tailwind CSS | 4.x | Configuración CSS-first con `@theme`; sin `tailwind.config.js` |
| next-intl | 4.x | `es-AR` (por defecto) y `en`, con prefijo de ruta |
| Zustand | 5.x | Carrito (con `persist`) y estado de UI |
| Zod | 4.x | Contrato de API y validación de entorno |
| Vitest | 5.x | `jsdom`, Testing Library, `axe-core` para accesibilidad de componente |
| Playwright | 1.63 | E2E + `@axe-core/playwright`, en su propio servicio |
| ESLint / Prettier | 9.x / 3.x | Flat config + `prettier-plugin-tailwindcss` |

### `api/` — esqueleto en marcha

Cuentas y sesión: [007](specs/007-api-autenticacion/plan.md) · ADR-0010 · ADR-0011.
El contrato del **catálogo** sigue en `web/src/lib/api/contract.ts`. El de
identidad vive en el plan 007, no en ese archivo Zod (el frontend no se
conecta en esta rebanada).

```powershell
docker compose -f docker/docker-compose.yml up db api
# http://localhost:8000/health  (o API_PORT)
docker compose -f docker/docker-compose.yml run --rm api uv run pytest
docker compose -f docker/docker-compose.yml run --rm --no-deps api uv run ruff check
```

`web` no depende de `db` ni de `api`. El gate de `web` sigue con `--no-deps`.

| Pieza | Elección |
|-------|----------|
| Python | 3.12, imagen oficial |
| HTTP | FastAPI + Uvicorn |
| Datos | SQLAlchemy 2 async, asyncpg, Alembic, Postgres 16 |
| Tests | pytest + pytest-asyncio + httpx, contra Postgres real |
| Lint | Ruff |
| Lock | `uv` + `uv.lock` (se genera al implementar; no hay pins en la spec) |

El gate (`.cursor/verify.json`) corre `api-lint` y `api-test` junto con los
checks de `web`. `api-test` levanta `db` (sin `--no-deps`). `api-lint` no lo
necesita.

## Comandos

Todos desde la raíz del repositorio.

```powershell
# Desarrollo con hot reload → http://localhost:3000 (o WEB_PORT)
docker compose -f docker/docker-compose.yml up web

# Gate de calidad de web (typecheck + lint + test + build)
docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run verify

# Gate de la API: ruff no necesita la base; pytest sí
docker compose -f docker/docker-compose.yml run --rm --no-deps api uv run ruff check
docker compose -f docker/docker-compose.yml run --rm api uv run pytest

# Checks sueltos
docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run typecheck
docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run lint
docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run test
docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run build

# E2E (levanta `web` y espera a que esté healthy)
docker compose -f docker/docker-compose.yml run --rm e2e
# suite concreta:  … run --rm e2e npm run test:e2e -- e2e/touch-targets.spec.ts

# Tras añadir una isla cliente al layout, reiniciar `web` antes del E2E
docker compose -f docker/docker-compose.yml restart web

# Regenerar .woff2 (sólo si cambia el set de caras del §02)
docker compose -f docker/docker-compose.yml run --rm fonts

# Formato
docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run format

# Añadir una dependencia sin Node en el host
docker run --rm -v "${PWD}/web:/app" -w /app node:22-alpine npm install --save <paquete>
docker compose -f docker/docker-compose.yml build web   # recompilar la imagen después
```

`--no-deps` evita arrancar el servicio `web` y esperar su healthcheck cuando sólo se quiere correr
un comando puntual.

## Configuración

| Archivo | Para qué |
|---------|----------|
| `web/.env.example` | `API_MODE`, `API_BASE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_ANNOUNCEMENT`, `NEXT_PUBLIC_SITE_URL` (opcional; origen absoluto para OG / hreflang) |
| `docker/.env.example` | Overrides de compose. Hoy sólo `WEB_PORT` |

Copiar cada `.env.example` a `.env` en su carpeta. Los `.env` están en `.gitignore`.

**`WEB_PORT`**: el puerto 3000 del host suele estar ocupado por otros proyectos. Definir
`WEB_PORT` en `docker/.env` para publicarlo en otro (en la máquina de Nico está en `3100`).

## Etapas del Dockerfile (`web/Dockerfile`)

| Etapa | Base | Uso |
|-------|------|-----|
| `deps` | `node:22-alpine` | `npm ci`, cacheado por `package-lock.json` |
| `dev` | `deps` | `next dev`; el código llega por bind mount |
| `builder` | `deps` | `next build` |
| `runner` | `node:22-alpine` | Producción: salida standalone, usuario no root |
| `e2e` | `mcr.microsoft.com/playwright` | Navegadores preinstalados. Detrás de un profile de compose para que un `build` normal no lo construya |

El tag de la imagen de Playwright **debe seguir la versión de `@playwright/test`** en
`package.json`; si se actualiza una, hay que actualizar la otra.
