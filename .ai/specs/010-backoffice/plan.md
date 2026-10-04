# Plan técnico · 010 Backoffice (login y guarda)

- **Estado:** propuesto (2026-09-28)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0014](../../decisions/0014-sesion-backoffice-session-storage.md)
  (Zustand + `sessionStorage`; la guarda es de cliente). Reusa
  [0001](../../decisions/0001-stack-frontend.md) (Next, TS estricto,
  Tailwind v4), [0004](../../decisions/0004-docker-first.md) (todo en
  Docker), [0005](../../decisions/0005-estrategia-de-testing.md) (Vitest;
  sin Playwright en esta rebanada) y [0006](../../decisions/0006-fuentes-versionadas.md)
  (el build no descarga fuentes). No reusa 0012: esa cookie es sólo de `web/`.

## 1 · Enfoque

Un segundo frontend, hermano de `web/`, que sólo sabe iniciar sesión.
La action de servidor habla con `api/`. El navegador recibe el bearer y
lo guarda en Zustand. Un componente cliente, después de rehidratar,
aplica la tabla de rutas de la spec.

`/dashboard` es un `main` vacío a propósito. No llama a `GET /me`: con
`must_change_password` ese GET es 403 y esta spec igual deja entrar.

No hay `next-intl`. La copy vive en un módulo `src/copy/es.ts` para que
AC-8 compare la frase exacta y no quede repartida en JSX.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `backoffice/Dockerfile` | Etapas `deps`, `dev`, `builder`, `runner`. Sin etapa e2e |
| `backoffice/docker-compose.yml` | Servicio `backoffice`, `container_name: sparks-backoffice` |
| `backoffice/.dockerignore` | `node_modules`, `.next`, `.git` |
| `backoffice/.env.example` | `API_BASE_URL=http://api:8000` |
| `backoffice/package.json` | Mismas mayores que `web/` para Next, React, TS, Tailwind, Zustand, Zod, Vitest. Sin `next-intl` ni Playwright |
| `backoffice/src/styles/theme.css` | Paleta de `web/src/styles/theme.css` (colores, familias, radios anulados). Sin la escala tipográfica completa |
| `backoffice/src/styles/fonts/` | Copia de los `.woff2` latinos que ya están en `web/`. No se descargan |
| `backoffice/src/copy/es.ts` | Todas las cadenas visibles, incluida la de RF-6 |
| `backoffice/src/lib/env.ts` | Zod: `API_BASE_URL` |
| `backoffice/src/lib/auth/contract.ts` | `loginRequestSchema`, `tokenResponseSchema`. Tipos inferidos |
| `backoffice/src/lib/auth/client.ts` | `login()` contra `API_BASE_URL`. Timeout 10s |
| `backoffice/src/lib/auth/actions.ts` | `loginAction`: valida, llama al cliente, traduce a un resultado chico |
| `backoffice/src/lib/auth/session-store.ts` | Zustand + `persist` + `sessionStorage` |
| `backoffice/src/lib/auth/guard.ts` | `decideRedirect(pathname, hasSession)` pura |
| `backoffice/src/components/auth/login-screen.tsx` | Composición de dos columnas |
| `backoffice/src/components/auth/login-form.tsx` | Campos, alerta, submit. La action llega por prop |
| `backoffice/src/components/auth/auth-gate.tsx` | Espera hidratación y aplica `decideRedirect` |
| `backoffice/src/app/layout.tsx` | Fuentes locales, `AuthGate`, fondo canvas |
| `backoffice/src/app/page.tsx` | No redirige en el servidor. El gate manda `/` a donde toque |
| `backoffice/src/app/login/page.tsx` | `LoginScreen` |
| `backoffice/src/app/unauthorized/page.tsx` | Título, mensaje, enlace |
| `backoffice/src/app/dashboard/page.tsx` | `<main />` vacío |
| `backoffice/src/**/__tests__/` | Un archivo por AC, al lado del código |
| `docker/docker-compose.yml` | `include` de `../backoffice/docker-compose.yml` |
| `docker/.env.example` | `BACKOFFICE_PORT=3200` |
| `.cursor/verify.json` | Cuatro checks nuevos, `--no-deps`, sin tocar los de `web` ni `api` |

`web/` y `api/` no se editan.

## 3 · Layout

Tokens de `web/src/styles/theme.css`. El botón usa las mismas clases que
`ButtonPrimary` de la tienda (`bg-ink`, hover `bg-accent-gold`) sin
importar ese archivo: son dos paquetes.

```
main  min-h-screen  grid  1 col <900; 1fr 1fr ≥900
  left   bg-ink text-canvas  flex col  justify-between
         pad clamp(42→70) / clamp(20→64)
    kicker   font-mono 10px tracking wide  text-accent-gold
             — SPARKS · BACKOFFICE
    wordmark SPARKS          font-display  grande  text-canvas
             PARFUMS         font-sans tracking wide  text-accent-gold
    list     tres filas, no son <a>
             01 PERFUMERÍA    Árabe, nicho e inspiraciones
             02 MAYORISTA     Franklin
             03 PAGO          Efectivo o transferencia
             índice en oro 10px (mismo criterio que ADR-0009: kicker, no título)
    foot     V 0.1 · ACCESO RESTRINGIDO   text-canvas/70
  right  bg-canvas  grid place-items-center  pad
    col    w-full max-w-[420px]
      kicker  01 / ACCESO    oro 10px
      h1      Iniciar sesión font-display text-ink
      form
        label correo / input  placeholder nombre@sparksinsumos.com
        label contraseña / input type password + botón mostrar
        alerta  role=alert  text-danger  14px  (sólo si hay error)
        button  type=submit  w-full  min-h-11  ENTRAR
```

Bordes de 1px (`border-border-strong`), sin radio, sin sombra. Inputs
sobre `bg-surface-raised`. El ojo es un SVG de trazo con
`aria-pressed` y nombre «Mostrar contraseña» / «Ocultar contraseña».

`/unauthorized` no reutiliza las dos columnas. Un bloque centrado sobre
canvas: kicker «Acceso», `h1` «No autorizado», el párrafo de RF-6, enlace
subrayado a `/login` con `min-h-11`.

`/dashboard`: `<main className="min-h-screen bg-canvas" />`. Sin `h1`.
La spec pide la página en blanco; un título sería una sección.

## 4 · Datos / API

Ningún cambio de contrato. Se consume sólo esto:

### `POST /auth/login`

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

`loginAction` devuelve al cliente una de estas tres formas, y nada más:

| Caso | Resultado |
|------|-----------|
| 200 y Zod ok | `{ ok: true, accessToken, mustChangePassword }` |
| 401 | `{ ok: false, code: "invalid_credentials" }` |
| Resto (red, timeout, 5xx, JSON inválido) | `{ ok: false, code: "unavailable" }` |

El formulario, si `ok`, hace `setSession` y `router.push("/dashboard")`.
Si no, pinta la frase de RF-3 y no toca el store.

Correo: `trim` + `toLowerCase` antes de llamar. Contraseña: tal cual.
Si uno de los dos queda vacío tras recortar el correo, no hay action.

`API_BASE_URL` lo lee sólo el servidor. No es `NEXT_PUBLIC_`: el
navegador no necesita el host de `api/` (ADR-0014).

### Store

```txt
accessToken: string | null
mustChangePassword: boolean
setSession(accessToken, mustChangePassword)
clearSession()          # existe; ninguna pantalla lo llama en 010
```

`persist` con `skipHydration` no hace falta si `AuthGate` espera
`onFinishHydration` / `hasHydrated`. Estado inicial en el servidor y en
el primer render: `accessToken: null`. Recién ahí se mira
`sessionStorage`.

## 5 · Docker

`docker/docker-compose.yml` suma:

```yml
include:
  - path: ../backoffice/docker-compose.yml
```

El compose del servicio:

- `container_name: sparks-backoffice` (el pedido pide ese nombre; `up`
  lo usa, `compose run` del gate sigue creando un contenedor de un solo
  uso).
- Puerto del host `${BACKOFFICE_PORT:-3200}:3000`. 3000 dentro del
  contenedor, como `web`, para no chocar con la tienda en el host.
- Bind mount del código, volumen anónimo en `node_modules` y `.next`.
- `WATCHPACK_POLLING=true`.
- `API_BASE_URL` por defecto `http://api:8000`.
- `depends_on: api` healthy, para que `up backoffice` traiga API y base.
- Healthcheck a `http://127.0.0.1:3000/login`.

`up web` no arrastra este servicio. El gate usa
`run --rm --no-deps backoffice`, igual que `web`.

Imagen de desarrollo: Node 22 Alpine, target `dev`, `next dev`.
Producción: `output: 'standalone'`, usuario no root. No se construye en
el ciclo de esta spec más que como check `build`.

## 6 · Trade-offs

| Elección | Spec | Por qué | Coste |
|----------|------|---------|-------|
| App nueva, no rutas dentro de `web/` | RF-1 | Otro contenedor y otra sesión | Se copian tokens y `.woff2` |
| Server action, no CORS | RF-3, ADR-0014 | `api/` no tiene CORS y el browser no ve el DNS `api` | El token atraviesa la respuesta de la action; es inevitable si luego vive en `sessionStorage` |
| Guarda en el cliente | RF-5 | `sessionStorage` no está en el servidor | El HTML de `/dashboard` no está protegido. Hoy está vacío |
| No llamar a `GET /me` | RF-4, decisión 4 | El admin semilla recibe 403 y esta spec igual abre el panel | El panel no sabe si el token sigue vivo |
| Sin `next-intl` | Decisión 5 | Rutas pedidas sin locale, una sola lengua | La copy no se traduce |
| Sin Playwright | RNF-4, pedido de unidad | El AC visual de píxeles no entra en jsdom | El apilado a 360px no tiene e2e |
| `container_name` fijo | RF-1 | El pedido nombra el contenedor | No se puede escalar el servicio a dos réplicas |

## 7 · Tests

Vitest + Testing Library. `login()` con `fetch` mockeado. El formulario
recibe la action por prop. `sessionStorage` es el de jsdom. No hay red
ni `api/` en el gate.

| AC | Dónde |
|----|--------|
| AC-1 | Test que lee `backoffice/docker-compose.yml` y `docker/docker-compose.yml` como texto: `container_name: sparks-backoffice`, el `include`, el puerto `BACKOFFICE_PORT` |
| AC-2 | `login-screen`: h1, labels, placeholder, «Entrar», las tres filas sin `<a>`, axe. Un test de `theme.css` exige `#14100e`, `#f5f1ea`, `#8a6b32` y `--color-*: initial` |
| AC-3 | `login-form`: vacío no llama; con datos llama `{ email: "ana@…", password }` ya en minúsculas |
| AC-4 | Store: `setSession` deja la clave en `sessionStorage` y no aparece en `localStorage`. El form, con action `ok`, navega a `/dashboard` |
| AC-5 | Action/form: 401 → frase de credenciales, store intacto, sin `push`. `unavailable` → la otra frase |
| AC-6 | Action 200 con `must_change_password: true` → `setSession(token, true)` y `push("/dashboard")` |
| AC-7 | `guard.test.ts` cubre la tabla de RF-5, incluido «hidratado = false → null» como contrato del componente: `AuthGate` no llama `replace` mientras `hasHydrated` es false |
| AC-8 | Página `/unauthorized`: h1, frase exacta importada de `copy/es.ts`, `href="/login"` |
| AC-9 | Página `/dashboard` con sesión simulada (el gate no redirige): el `main` no tiene headings, links ni form |

La action se testea aparte del formulario: un `fetch` que responde 200,
401 y un rechazo de red. El cliente no incluye el token en ningún
`console`.

Checks nuevos en `.cursor/verify.json`, los cuatro con
`docker compose -f docker/docker-compose.yml run --rm --no-deps backoffice`:

- `backoffice-typecheck` → `npm run typecheck`
- `backoffice-lint` → `npm run lint`
- `backoffice-test` → `npm run test`
- `backoffice-build` → `npm run build`

Axe entra en el test de AC-2 (`axe-core` directo, como en `web`, sin
`vitest-axe`).

## 8 · Riesgos

| Riesgo | Qué lo contiene |
|--------|-----------------|
| XSS lee el bearer | ADR-0014 lo deja escrito. Esta spec no pinta datos. La siguiente que los pida tiene que ser cliente y no ampliar el almacenamiento |
| Parpadeo de «no autorizado» al recargar | `AuthGate` no redirige hasta `hasHydrated` |
| Admin semilla entra y la API le responde 403 en cuanto haya datos | Fuera de alcance. No se llama a `/me` |
| Cualquier cliente de la tienda entra al backoffice | 007 no tiene roles. Queda dicho en la spec, no se inventa un filtro |
| `container_name` choca si el contenedor ya existe | Un `up` previo se reutiliza; documentar el nombre en `stack.md` al implementar |
| Copiar `.woff2` y que se desfasen de `web/` | Misma lista de archivos. No hay etapa `fonts` nueva: si cambia la cara, se copia a mano |

## 9 · Fuera de este plan

- Pantalla de cambio de contraseña.
- Logout que llame a `POST /auth/logout`.
- Roles, menú, CRUD.
- CORS en `api/`.
- Playwright del backoffice.
- Compartir un paquete de tokens entre `web/` y `backoffice/`.
