# ADR 0004: Docker-first — desarrollo, tests y gate de calidad en contenedores

- **Status:** accepted
- **Date:** 2026-09-22
- **Deciders:** Nico + agente

## Context

Requisito explícito del usuario: «el proyecto debe vivir en un entorno de Docker, no quiero tener
dependencias en mi ordenador». Eso va más allá de empaquetar para producción: si `npm test` exige
Node instalado, el requisito no se cumple. Además `.cursor/rules/30-verification.mdc` obliga a
ejecutar los checks de `.cursor/verify.json` antes de cerrar cualquier turno, y hoy esos cuatro
checks están vacíos y deshabilitados — habría que llenarlos con comandos que no requieran Node local.

`.ai/architecture.md` ya registra una convención Docker para este repo: cada servicio es una
carpeta autocontenida con `Dockerfile`, `docker-compose.yml`, `.dockerignore` y `.env.example`, y
la carpeta `docker/` sólo orquesta, sin duplicar nunca un Dockerfile.

## Decision

- El storefront es el servicio `web/`, con la estructura que exige la convención. El backend futuro
  entrará como `api/`.
- **Un único `Dockerfile` multi-etapa**: `deps` → `dev` → `builder` → `runner` → `e2e`.
  - `dev`: `next dev` con bind mount del código y volumen anónimo en `node_modules`, para que las
    dependencias instaladas en la imagen no queden pisadas por el montaje del host.
  - `runner`: salida `standalone` de Next, usuario no root.
  - `e2e`: base `mcr.microsoft.com/playwright`, **separada a propósito** — su imagen pesa ~2GB y no
    tiene por qué formar parte del ciclo de desarrollo diario.
- **`.cursor/verify.json` invoca `docker compose run --rm`** para typecheck, lint, test y build. El
  gate de calidad del repo funciona en un clon limpio sin Node instalado (AC-19).
- No se añaden scripts de conveniencia con `make`: el entorno del usuario es PowerShell en Windows.
  Los comandos `docker compose` se documentan tal cual en `.ai/stack.md`.

## Alternatives considered

- **Node local con Docker sólo para producción.** Lo más rápido de arrancar y exactamente lo que el
  usuario pidió evitar.
- **Dev containers.** Buena ergonomía dentro del editor, pero atan el flujo a VS Code/Cursor; los
  comandos de verificación deben poder correr desde cualquier terminal y desde CI.
- **Un Dockerfile por propósito** (`Dockerfile.dev`, `Dockerfile.test`, `Dockerfile.prod`).
  Triplica el mantenimiento de la instalación de dependencias y contradice la convención ya
  registrada en `architecture.md`, que habla de un `Dockerfile` por servicio.
- **Playwright dentro de la imagen de desarrollo.** Un único contenedor, pero ~2GB añadidos a cada
  rebuild del entorno diario a cambio de nada.

## Consequences

- El desarrollador sólo necesita Docker. Se cumple el requisito tal como fue enunciado.
- Cada comando arrastra el arranque del contenedor (~1–2s). Aceptable.
- En Windows el bind mount hace que el file watching de Next sea poco fiable; se activa
  `WATCHPACK_POLLING=true`, a costa de algo de CPU en reposo.
- La imagen de Playwright se construye una vez y se reutiliza; sólo la paga quien corre E2E.
- Hay que cuidar el `.dockerignore` (`node_modules`, `.next`, `.git`, `test-results`) o el contexto
  de build se vuelve lento.
