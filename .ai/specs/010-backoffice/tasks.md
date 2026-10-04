# Tasks · 010 Backoffice (login y guarda)

- **Estado:** cerrada (T293–T310)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0014](../../decisions/0014-sesion-backoffice-session-storage.md)

No se toca `web/` ni `api/`. Los tests no pegan a una API viva: `fetch` se
mockea y el formulario recibe la action por prop. El lockfile sale de
`npm install` dentro de una imagen Node 22; no se escribe a mano.

Cada tarea de comportamiento se escribe en rojo y después el mínimo de
código que la pone verde.

## Setup

- [x] **T293 · Toolchain** → RF-1, RNF-4, RNF-5
  Proyecto `backoffice/` con las mismas mayores que `web/package.json`:
  Next `16.3.5`, React `19.2.8`, TypeScript `^5`, Tailwind `^4`, Zustand
  `^5.0.15`, Zod `^4.6.5`, Vitest `^5.0.1`, Testing Library, `axe-core`,
  ESLint 9, Prettier. Sin `next-intl` y sin Playwright.
  `tsconfig` estricto (`noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`), alias `@/*`. `next.config.ts` con
  `output: "standalone"` y `allowedDevOrigins` para `backoffice`,
  `localhost` y `127.0.0.1`. PostCSS de Tailwind v4. ESLint sin la regla
  `no-literal-string` (no hay i18n). Vitest en jsdom, include
  `src/**/*.{test,spec}.{ts,tsx}`.
  Generar `package-lock.json` con
  `docker run --rm -v` del directorio y `node:22-alpine`, `npm install`.
  Archivos: `backoffice/package.json`, `package-lock.json`, `tsconfig.json`,
  `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`,
  `vitest.config.mts`, `vitest.setup.ts`, `.gitignore`, `.prettierrc` si
  `web/` tiene uno y hace falta para el formato.

- [x] **T294 · Contenedor** → US-1, RF-1, AC-1
  Depende de T293. Test primero:
  `backoffice/src/lib/__tests__/compose.test.ts`. Lee como texto
  `backoffice/docker-compose.yml` y `docker/docker-compose.yml` y exige
  `container_name: sparks-backoffice`, el `include` de
  `../backoffice/docker-compose.yml`, y `BACKOFFICE_PORT` con default
  `3200`. `docker/.env.example` documenta ese puerto.
  Dockerfile en etapas `deps` → `dev` → `builder` → `runner` (usuario no
  root, standalone). Sin etapa e2e ni fonts. `.dockerignore` como el de
  `web/` (sin Playwright). Compose: bind mount, volúmenes anónimos en
  `node_modules` y `.next`, `WATCHPACK_POLLING=true`,
  `API_BASE_URL` default `http://api:8000`, `depends_on` de `api` healthy,
  healthcheck a `http://127.0.0.1:3000/login`. `.env.example` con
  `API_BASE_URL`.
  `up web` no gana una dependencia nueva.
  Archivos: `backoffice/Dockerfile`, `docker-compose.yml`, `.dockerignore`,
  `.env.example`, `docker/docker-compose.yml`, `docker/.env.example`, el test.

- [x] **T295 · Tokens y fuentes** → RF-2, RNF-1, ADR-0006
  Depende de T293. Test primero:
  `backoffice/src/styles/__tests__/tokens.test.ts`. `theme.css` contiene
  `#14100e`, `#f5f1ea`, `#8a6b32` y `--color-*: initial`. No contiene un
  hex azul de la captura (`#1b3a4b`, `#4a6fa5`, `#5b7c99` ni similares que
  se cuelen).
  Copiar la paleta, las tres familias y la anulación de radios desde
  `web/src/styles/theme.css`. Sin la escala tipográfica completa.
  Copiar los diez `.woff2` que lista `web/src/styles/fonts.ts` a
  `backoffice/src/styles/fonts/`. `fonts.ts` local, mismas variables
  `--font-cormorant`, `--font-jost`, `--font-plex-mono`. No se descarga nada.
  Archivos: `theme.css`, `fonts.ts`, `src/styles/fonts/*.woff2`, el test.

## Foundational

- [x] **T296 · Copy** `[P]` → RF-2, RF-3, RF-6
  Puede ir en paralelo con T294 y T295, después de T293.
  `backoffice/src/copy/es.ts` concentra las cadenas: kicker de marca,
  wordmark, las tres líneas (perfumería / mayorista / pago), «Iniciar
  sesión», etiquetas, placeholder `nombre@sparksinsumos.com`, «Entrar»,
  «Mostrar contraseña» / «Ocultar contraseña», «Completá correo y
  contraseña.», «Credenciales inválidas.», «No pudimos iniciar sesión.
  Intentá de nuevo.», título «No autorizado», mensaje exacto de RF-6
  («No podés entrar a esta sección sin iniciar sesión.») y «Ir a iniciar
  sesión».
  Test: `backoffice/src/copy/__tests__/es.test.ts` afirma esa frase y que
  no aparece «ADS» ni `adsinversiones`.
  Archivos: `src/copy/es.ts`, el test.

- [x] **T297 · Entorno** `[P]` → RNF-3
  Test primero: `backoffice/src/lib/__tests__/env.test.ts`.
  `API_BASE_URL` es URL http(s) sin barra final. Default de test
  `http://api:8000` cuando la variable no está. Rechaza un valor vacío.
  No es `NEXT_PUBLIC_`.
  Archivos: `src/lib/env.ts`, el test.

- [x] **T298 · Contrato Zod** `[P]` → RF-3, AC-3
  Test primero: `backoffice/src/lib/auth/__tests__/contract.test.ts`.
  `loginRequestSchema` acepta `{ email, password }` y rechaza una clave
  extra. `tokenResponseSchema` exige `access_token` no vacío,
  `token_type: "bearer"` y `must_change_password` boolean. Los tipos se
  infieren.
  Archivos: `src/lib/auth/contract.ts`, el test.

- [x] **T299 · Guarda** `[P]` → RF-5, AC-7
  Test primero: `backoffice/src/lib/auth/__tests__/guard.test.ts`.
  `decideRedirect(pathname, hasSession, hydrated)`:
  - `hydrated === false` → `null` en cualquier ruta.
  - Sin sesión e hidratado: `/`, `/dashboard` y `/pedidos` →
    `/unauthorized`. `/login` y `/unauthorized` → `null`.
  - Con sesión: `/login`, `/unauthorized` y `/` → `/dashboard`.
    `/dashboard` → `null`.
  Archivos: `src/lib/auth/guard.ts`, el test.

- [x] **T300 · Store de sesión** → RF-4, AC-4
  Depende de T293. Test primero:
  `backoffice/src/lib/auth/__tests__/session-store.test.ts`.
  `setSession("tok", true)` deja `accessToken` y `mustChangePassword` en
  el store y persiste bajo la clave `sparks-backoffice-session` en
  `sessionStorage`. `localStorage` queda vacío. `clearSession` borra el
  token. Partir de `accessToken: null` antes de rehidratar.
  Archivos: `src/lib/auth/session-store.ts`, el test.

- [x] **T301 · Cliente HTTP** → RF-3, RNF-2
  Depende de T297 y T298. Test primero:
  `backoffice/src/lib/auth/__tests__/client.test.ts`.
  `fetch` mockeado. `login` hace `POST {API_BASE_URL}/auth/login` con
  `{ email, password }`, timeout 10s. 200 que cumple el esquema devuelve
  el token. 401 devuelve `invalid_credentials` sin parsear un token. Un
  rechazo de red, un 500 y un JSON inválido devuelven `unavailable`.
  Espiar `console` y afirmar que ni el token ni el cuerpo ni
  `Authorization` se imprimen.
  Archivos: `src/lib/auth/client.ts`, el test.

- [x] **T302 · Server action** → RF-3, RF-4, AC-5, AC-6
  Depende de T301. Test primero:
  `backoffice/src/lib/auth/__tests__/actions.test.ts`.
  Action inyectable (cliente falso), no el runtime de Next.
  - 200 con `must_change_password: false` →
    `{ ok: true, accessToken, mustChangePassword: false }`.
  - 200 con el flag en true → el mismo ok y `mustChangePassword: true`.
  - 401 → `{ ok: false, code: "invalid_credentials" }`.
  - Red / 500 → `{ ok: false, code: "unavailable" }`.
  El resultado no incluye el cuerpo crudo de la API.
  Archivos: `src/lib/auth/actions.ts`, el test.

## US-2 · Iniciar sesión

- [x] **T303 · Pantalla de login** → US-2, RF-2, AC-2, RNF-1
  Depende de T295 y T296. Test primero:
  `backoffice/src/components/auth/__tests__/login-screen.test.tsx`.
  `h1` «Iniciar sesión», labels de correo y contraseña, placeholder
  `nombre@sparksinsumos.com`, botón «Entrar», wordmark Sparks, las tres
  filas sin `<a>`. No está el texto «ADS» ni `adsinversiones` ni un
  enlace de recuperación. Axe sin violaciones (`expectNoA11yViolations`,
  contraste apagado como en `web/src/test/a11y.ts`).
  Layout del plan §3: grilla 1 col / 2 col desde 900px, panel `bg-ink`,
  formulario sobre canvas, botón `bg-ink` ancho completo `min-h-11`.
  Página `src/app/login/page.tsx` monta la pantalla. El formulario todavía
  puede no llamar a la action real.
  Archivos: `login-screen.tsx`, `login-form.tsx`, `login/page.tsx`,
  `src/test/a11y.ts`, el test.

- [x] **T304 · Submit** → US-2, RF-3, RF-4, AC-3, AC-4, AC-5, AC-6
  Depende de T300, T302 y T303. Test primero:
  `backoffice/src/components/auth/__tests__/login-form.test.tsx`.
  - Correo y contraseña vacíos: no llama a la action y muestra «Completá
    correo y contraseña.».
  - `Ana@Sparks.com` + clave llama con `email: "ana@sparks.com"` y la
    contraseña intacta.
  - `{ ok: false, code: "invalid_credentials" }`: alerta «Credenciales
    inválidas.», store sin token, sin `push`.
  - `unavailable`: la otra frase, tampoco navega.
  - `{ ok: true, accessToken, mustChangePassword: false }` guarda el token
    en el store y hace `push("/dashboard")`.
  - El mismo ok con `mustChangePassword: true` también guarda y navega.
  El botón de mostrar contraseña alterna `type` y `aria-pressed`.
  Archivos: `login-form.tsx`, el test.

## US-3 · Sin sesión

- [x] **T305 · AuthGate** → US-3, RF-5, AC-7
  Depende de T299 y T300. Test primero:
  `backoffice/src/components/auth/__tests__/auth-gate.test.tsx`.
  Con el store sin hidratar, no llama a `replace` aunque la ruta sea
  `/dashboard`. Hidratado y sin token, en `/dashboard` llama
  `replace("/unauthorized")`. Hidratado y con token, en `/login` llama
  `replace("/dashboard")`.
  Archivos: `auth-gate.tsx`, el test.

- [x] **T306 · Página no autorizado** → US-3, RF-6, AC-8
  Depende de T296. Puede ir en paralelo con T305.
  Test primero:
  `backoffice/src/app/unauthorized/__tests__/page.test.tsx`.
  `h1` «No autorizado», el mensaje importado de `copy/es.ts` (la frase
  exacta de RF-6) y un enlace «Ir a iniciar sesión» con `href="/login"`.
  Archivos: `src/app/unauthorized/page.tsx`, el test.

## US-4 · Panel

- [x] **T307 · Dashboard vacío** → US-4, RF-7, AC-9
  Depende de T305. Test primero:
  `backoffice/src/app/dashboard/__tests__/page.test.tsx`.
  Con sesión simulada (el gate no redirige), hay un `main` y no hay
  `h1`–`h6`, ni `a`, ni `form`.
  `src/app/page.tsx` no redirige en el servidor: renderiza los children y
  deja que el gate mande `/` a `/dashboard` o a `/unauthorized`.
  `src/app/layout.tsx` carga las fuentes, fondo canvas y monta `AuthGate`.
  Archivos: `dashboard/page.tsx`, `app/page.tsx`, `app/layout.tsx`,
  `globals.css` (importa `theme.css`), el test.

## Polish

- [x] **T308 · Gate de calidad** → RNF-4
  Depende de T294–T307. Sumar a `.cursor/verify.json` cuatro checks,
  todos `docker compose -f docker/docker-compose.yml run --rm --no-deps backoffice`:
  `backoffice-typecheck`, `backoffice-lint`, `backoffice-test`,
  `backoffice-build`. No se desactivan los de `web` ni `api`.
  `stack.md` documenta el servicio, el puerto `BACKOFFICE_PORT` y los
  comandos. `architecture.md` describe el backoffice y la guarda de
  cliente. `project.md` suma `backoffice/` a la estructura.

- [x] **T309 · Arranque** → US-1, RF-1
  Depende de T308. `docker compose -f docker/docker-compose.yml up -d --build backoffice`
  (trae `api` y `db` por el `depends_on`). El contenedor se llama
  `sparks-backoffice` y `/login` responde 200. Anotar en `lessons.md`
  sólo si algo del bind mount o del healthcheck se desvía del plan.

- [x] **T310 · Verify y handoff** → RNF-4
  Depende de T309. `/verify` verde, incluida la suite nueva. Tildar esta
  lista. `progress.md`: estado y el paso siguiente (el panel sigue vacío;
  roles y cambio de clave siguen fuera).

## Dependencias

```
T293 → T294 (US-1, AC-1)
     → T295 ─────────────→ T303 → T304 (US-2)
     → T296 [P] ─────────→ T303, T306
     → T297 [P] ↘
     → T298 [P] → T301 → T302 ↗ T304
     → T299 [P] → T305 → T307 (US-4)
     → T300 ───→ T304, T305
T306 [P] (AC-8) puede ir junto a T305
T294–T307 → T308 → T309 → T310
```

T296–T300 pueden ir en paralelo una vez que existe el toolchain. T301
espera contrato y entorno. T304 espera action, store y pantalla. T307
espera el gate. T310 cierra.

## Definition of Done

- T293–T310 tildadas.
- AC-1…AC-9 cubiertos por Vitest, sin API viva.
- `/verify` verde. Los cuatro checks de `backoffice` corren con `--no-deps`.
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- `web/` y `api/` sin cambios. Roles, logout, cambio de clave y contenido
  del panel, sin implementar.
