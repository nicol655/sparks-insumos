# Tasks · 008 Cuenta en el storefront

- **Estado:** cerrada (T270–T286)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0012](../../decisions/0012-sesion-storefront-cookie-httponly.md)

Clave válida de los tests: `Sparks1!`. Teléfono válido: `+5491168692694`.
`admin123456` no cumple la política. Los tests no pegan a `api/` (RNF-5):
`fetch` se mockea y los formularios reciben la action por prop.

Cada tarea de comportamiento se escribe en rojo y después el mínimo de
código que la pone verde. No se toca `api/`. `routing.ts` no se toca.

## Setup

- [x] **T270 · Diccionario** → RF-1, RF-3, RF-5, RNF-3
  Namespaces `auth` y `account` en `messages/{es,en}.json`: títulos, bajadas,
  pestañas, campos, placeholders, pies, alertas de RF-3 (incluido el texto
  exacto «Los datos introducidos son incorrectos»), fichas, drawer, diálogo
  y el 403 de cambio de clave. Los beneficios del panel salen de `home.club`,
  no se duplican. Allowlist de paridad sólo si una clave coincide a propósito.
  Archivos: `web/src/i18n/messages/{es,en}.json`,
  `web/src/i18n/__tests__/messages.test.ts`.

## Foundational

- [x] **T271 · Contrato Zod** `[P]` → RF-2, RF-3, RF-7, RNF-2
  Test primero: `web/src/lib/auth/__tests__/contract.test.ts`.
  Esquemas de login, registro (siete campos), `PATCH` (sólo los cuatro) y
  `UserPublic` (sin `password` ni `password_hash`). Los tipos se infieren.
  Un cuerpo de más en el patch no pasa.
  Archivos: `web/src/lib/auth/contract.ts`, el test de arriba.

- [x] **T272 · Validación de DTO** `[P]` → RF-3, RF-7, AC-5
  Test primero: `web/src/lib/auth/__tests__/validate.test.ts`.
  `validateRegister` y `validateProfile` devuelven el primer fallo en orden
  de formulario: nombre, apellido, correo, teléfono, contraseña. Aceptan
  `Sparks1!` y `+5491168692694`. Rechazan vacío, teléfono `11`, clave
  `admin123456`, espacio, y un nombre de 81. El perfil con contraseña no
  vacía devuelve `password_unchanged_here` y no trata el resto.
  Archivos: `web/src/lib/auth/validate.ts`, el test de arriba.

- [x] **T273 · `safeNext`** `[P]` → RF-2, RNF-4, AC-4
  Test primero: `web/src/lib/auth/__tests__/return-to.test.ts`.
  Acepta un path interno del locale (`/es/catalogo?q=oud`). Rechaza vacío,
  `//evil`, `https://`, `\`, path de ingresar y path de registro: en esos
  casos devuelve el catálogo de ese locale.
  Archivos: `web/src/lib/auth/return-to.ts`, el test de arriba.

- [x] **T274 · Cookies de sesión** `[P]` → RF-4, RNF-1, ADR-0012
  Test primero: `web/src/lib/auth/__tests__/session.test.ts`.
  `setSession` escribe `sparks_session` (HttpOnly, el token) y
  `sparks_signed_in=1` (sin HttpOnly, sin token). `Max-Age` 21600,
  `SameSite=Lax`, `Path=/`. `Secure` sólo si se pide. `clearSession` borra
  las dos. `readToken` lee sólo la httpOnly.
  Archivos: `web/src/lib/auth/session.ts`, el test de arriba.
  El test usa un jar falso; no importa `next/headers` en la aserción.

- [x] **T275 · Cliente HTTP** → RF-2, RF-3, RF-6, RF-7, RF-8, AC-6
  Depende de T271. Test primero: `web/src/lib/auth/__tests__/client.test.ts`.
  `fetch` mockeado. `register` hace `POST /auth/register` con
  `accept_terms: true` y `password_confirmation === password`. `login` es
  `POST /auth/login`. `logout` / `getMe` / `patchMe` / `deleteMe` mandan
  `Authorization: Bearer`. `patchMe` serializa sólo las cuatro claves.
  401, 403 `password_change_required`, 409 `email_taken` y un JSON que no
  cumple el contrato se distinguen. No se loguea el token ni el cuerpo.
  Archivos: `web/src/lib/auth/client.ts`, el test de arriba.

- [x] **T276 · Server actions** → RF-2, RF-3, RF-4, RF-6, RF-7, RF-8, AC-4, AC-6, AC-7, AC-10, AC-11, AC-12
  Depende de T272–T275. Test primero: `web/src/lib/auth/__tests__/actions.test.ts`.
  Actions inyectables (cliente, cookies y redirect falsos), no el runtime
  de Next.
  - Login 200: `setSession` y redirect al `safeNext`. 401: no cookie, código
    `invalid_credentials`. 500: código genérico, sin cookie.
  - Register inválido: no hay `fetch`. 201 + login 200: cookie y redirect a
    `/cuenta`. 201 + login no-200: redirect a ingresar con `next` de cuenta,
    sin cookie. 409: `email_taken`, sin login de cortesía.
  - Logout: `POST /auth/logout`, `clearSession` y redirect al catálogo aunque
    el cliente tire o responda 500.
  - Patch: contraseña con texto no llama al cliente. Datos válidos mandan
    los cuatro campos. 409 deja el código `email_taken`.
  - Delete 204: limpia y redirige al catálogo. 500: no limpia, código de fallo.
  - `GET` 401: la guarda limpia y arma el redirect a ingresar con `next`
    de cuenta (AC-8).
  Archivos: `web/src/lib/auth/actions.ts`, el test de arriba.

## US-1 · Ingresar

- [x] **T277 · Shell y página de ingreso** → US-1, RF-1, AC-1, AC-14
  Depende de T270. `auth-screen.tsx`: dos columnas desde `lg`, pestañas,
  `h1`, bajada, hueco del formulario, pie, panel ink con `GOLD_KICKER` y
  beneficios `home.club` (`GOLD_INDEX`). Página
  `app/[locale]/ingresar/page.tsx` con `seoMetadata()`.
  Test primero: `web/src/components/auth/__tests__/auth-screen.test.tsx`.
  Español e inglés: pestañas, «Bienvenida de vuelta.» / «Welcome back.»,
  email, contraseña, botón «Ingresar» / «Sign in», panel Sparks Club, sin
  alerta. La pestaña inactiva enlaza a `/registro`. Axe sin
  critical/serious.
  Archivos: `auth-screen.tsx`, `login-form.tsx` (aún sin action real),
  `ingresar/page.tsx`, el test.

- [x] **T278 · Submit de ingreso** → US-1, RF-2, AC-3, AC-4
  Depende de T276 y T277. El formulario llama a la action inyectada.
  Test en `web/src/components/auth/__tests__/login-form.test.tsx`.
  Action que devuelve `invalid_credentials`: alerta «Los datos introducidos
  son incorrectos» justo arriba del botón, sin navegación. Acción genérica:
  el otro texto, no el de credenciales. 200: la action es quien redirige
  (el test afirma que se la llamó con correo, contraseña y `next`).
  Los `Link` de club hacia ingresar no se reescriben en esta tarea: el
  `next` lo arma `AccountLink` en T284 y el formulario lee el query.
  Archivos: `login-form.tsx`, `actions.ts` (sólo si falta el código de
  error genérico), el test.

## US-2 · Registro

- [x] **T279 · Página y submit de registro** → US-2, RF-1, RF-3, AC-2, AC-5, AC-6, AC-7, AC-14
  Depende de T276 y T277. Misma shell, pestaña «Crear cuenta» activa,
  cinco campos (email a `md:col-span-2`), pie que no es enlace.
  Página `app/[locale]/registro/page.tsx`.
  Test primero: `web/src/components/auth/__tests__/register-form.test.tsx`
  más el caso de página en el test del shell.
  Nombre vacío, teléfono `11` y `admin123456` no llaman a la action y
  muestran el mensaje de RF-3 arriba de «Crear cuenta». 409 muestra
  «Ese correo ya está registrado.» y no navega. Datos válidos llaman a la
  action (el login de cortesía y el redirect viven en T276). Axe.
  Archivos: `register-form.tsx`, `registro/page.tsx`, los tests.

## US-3 · Ver la cuenta

- [x] **T280 · Página `/cuenta`** → US-3, RF-5, AC-8, AC-9, AC-14
  Depende de T270, T275 y T276. RSC `app/[locale]/cuenta/page.tsx`: sin
  token, redirect a ingresar con `next` de cuenta. Con token, `GET /me`.
  401 limpia y redirige. 403 `password_change_required`: saludo genérico,
  el párrafo del candado, botón «Salir», sin fichas, sin drawer, sin borrar.
  200: `account-view.tsx` con `h1` «Hola, {first_name}», kicker con el año de
  `created_at`, tres fichas (correo, teléfono, alta formateada). No aparece
  «VIP15» ni un id `SP-`. Sin tabla de pedidos.
  Test primero: `web/src/components/account/__tests__/account-view.test.tsx`
  (fixture `UserPublic` y el estado 403). La guarda de AC-8 queda cubierta
  por T276; esta tarea sólo la usa.
  Archivos: `cuenta/page.tsx`, `account-view.tsx`, el test.

## US-4 · Salir

- [x] **T281 · Botón Salir** → US-4, RF-6, AC-10
  Depende de T276 y T280. «Salir» dispara `logoutAction`. El test del
  view afirma que el click llama a la action inyectada. Limpiar cookies
  y redirigir aunque el logout falle ya está en T276: no se duplica la
  aserción del jar, sólo el cableado.
  Archivos: `account-view.tsx`, el test de T280.

## US-5 · Editar

- [x] **T282 · Drawer de perfil** → US-5, RF-7, AC-11, AC-14
  Depende de T276 y T280. `profile-drawer.tsx`: 460px / 94vw, foco atrapado,
  Escape y backdrop cierran y devuelven el foco a «Editar perfil». Al abrir,
  `useUiStore.close()`. Campos del prototipo más la nota de la contraseña.
  Pie: «Cancelar» y «Guardar cambios». Alerta arriba del guardar, a lo ancho
  de las dos columnas.
  Test primero: `web/src/components/account/__tests__/profile-drawer.test.tsx`.
  Contraseña con texto: no llama a la action y muestra «La contraseña no se
  cambia desde acá.». Contraseña vacía y datos válidos: `PATCH` con sólo
  los cuatro campos. 200 cierra el drawer y el view pinta el usuario nuevo.
  409 deja el drawer abierto con «Ese correo ya está registrado.». Axe del
  drawer abierto.
  Archivos: `profile-drawer.tsx`, `account-view.tsx`, el test.

## US-6 · Eliminar cuenta

- [x] **T283 · Diálogo de borrado** → US-6, RF-8, AC-12, AC-14
  Depende de T276 y T280. `delete-account-dialog.tsx`: `role="alertdialog"`,
  kicker en `text-danger` (no oro), «¿Eliminar tu cuenta?», cuerpo del
  prototipo, «Cancelar» y «Sí, eliminar». Escape cancela.
  Test primero: `web/src/components/account/__tests__/delete-account-dialog.test.tsx`.
  «Sí, eliminar» llama a la action. Un fallo deja el diálogo abierto y
  muestra «No pudimos eliminar la cuenta.» arriba de ese botón. El 204 que
  limpia y redirige queda en T276.
  Archivos: `delete-account-dialog.tsx`, `account-view.tsx`, el test.

## Chrome

- [x] **T284 · «Mi cuenta» en el chrome** `[P]` → AC-13
  Depende de T270 y T274. Puede ir en paralelo con T277–T283.
  `account-link.tsx` arranca en «Ingresar» (`href` `/ingresar`). Tras montar,
  si `document.cookie` tiene `sparks_signed_in=1`, pasa a «Mi cuenta» hacia
  `/cuenta`. Header, menú móvil y footer lo usan en lugar del `Link` fijo.
  El click hacia ingresar conserva `?next=` del pathname actual.
  Test primero: `web/src/components/layout/__tests__/account-link.test.tsx`.
  Actualizar los tests de header, menú y footer que hoy afirman el href
  `/ingresar` fijo: sin cookie sigue siendo ingresar.
  Archivos: `account-link.tsx`, `header.tsx`, `footer.tsx`, `mobile-menu.tsx`,
  los tests.

## Polish

- [x] **T285 · E2E visual** → AC-1, AC-2, AC-14
  Depende de T277, T279 y T280. `web/e2e/auth.spec.ts`: `/es/ingresar`,
  `/en/sign-in`, `/es/registro`, `/en/register`, `/es/cuenta` (esta última
  redirige a ingresar sin cookie: afirmar la URL de destino, no un 200 de
  cuenta). Un solo `h1`. La alerta de ingreso no está al cargar. La pestaña
  cambia de ruta. No se envía el formulario. Sumar las rutas públicas al
  smoke de `web/e2e/helpers.ts` si ese arreglo es el que visita páginas.
  No se añade `api` al servicio `e2e`.

- [x] **T286 · Verify y handoff** → RNF-5, RNF-6
  Depende de T278–T285. Gate de `.cursor/verify.json` en verde (sigue
  `--no-deps` para `web`). E2E de `e2e/auth.spec.ts` en los cuatro
  viewports; touch en mobile-360. Si una isla nueva no aparece, reiniciar
  `web` antes del E2E. Tildar esta lista. `progress.md` con el estado y el
  paso siguiente. `architecture.md` pasa a describir la cuenta como
  conectada sólo cuando T277–T284 están hechas. No se cambia `verify.json`.

## Dependencias

```
T270 ─────────────────────────────→ T277 → T278
        ↘ T284 [P]                  ↘ T279
T271 [P] → T275 ↘
T272 [P] ────────→ T276 → T280 → T281
T273 [P] ────────↗              ↘ T282
T274 [P] ────────↗              ↘ T283
                                 T285 → T286
```

T271–T274 pueden ir en paralelo, y en paralelo con T270. T275 espera a
T271. T276 espera a T272–T275. T284 sólo necesita el diccionario y el
nombre de la cookie. T277 puede arrancar con T270, sin esperar al cliente.
T285 espera las tres páginas. T286 cierra.

## Definition of Done

- T270–T286 tildadas.
- AC-1…AC-14 cubiertos por Vitest (sin API viva) y el smoke E2E de T285.
- `/verify` verde. El gate de `web` sigue con `--no-deps`.
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- `api/` sin cambios. Cambio de contraseña, pedidos y cupón, sin implementar.
