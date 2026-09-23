# Sparks Parfums — storefront (`web/`)

Next.js 16 App Router, next-intl (`/es` · `/en`), tokens del PDF en `src/styles/theme.css`.
**Todo corre en Docker.** No hace falta Node ni navegadores en el host.

Comandos, env y etapas del Dockerfile: [`.ai/stack.md`](../.ai/stack.md).
Diseño y flujos: [`.ai/architecture.md`](../.ai/architecture.md).
Convenciones: [`.ai/conventions.md`](../.ai/conventions.md).

```powershell
# desde la raíz del repo
docker compose -f docker/docker-compose.yml up web                          # http://localhost:${WEB_PORT:-3000}
docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run verify
docker compose -f docker/docker-compose.yml run --rm e2e
```

Rutas de Fase 1: `/es`, `/es/catalogo`, `/es/catalogo/[slug]`, `/es/carrito` (y sus pares `/en`).
El checkout, login, cuenta y contacto son Fase 2. Los datos salen de `CatalogRepository`
(`API_MODE=mock` hoy).
