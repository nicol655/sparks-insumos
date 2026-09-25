# Plan técnico · 008 Cuenta en el storefront

- **Estado:** propuesto (2026-09-25)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0012](../../decisions/0012-sesion-storefront-cookie-httponly.md)
  (cookie httpOnly + cookie de presencia). Reusa 0002 (rutas ya traducidas),
  0003 (la UI no hace `fetch`), 0009 (kicker oro 10px) y 0011 (bearer de 007).

## 1 · Enfoque

Tres páginas que reclaman rutas que hoy caen en `[...rest]`. Ingresar y
registro comparten un shell. La cuenta es una página de servidor que lee
la cookie y pide `GET /me`, más una isla para el drawer y el diálogo.

El navegador no llama a `api/`. Las mutations son server actions
(`"use server"`) que validan con Zod, pegan a `API_BASE_URL` y escriben
cookies. El catálogo no se entera: `API_MODE` sigue en `mock`.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `web/src/lib/auth/contract.ts` | Zod de login, registro, `PATCH` y `UserPublic`. Tipos inferidos |
| `web/src/lib/auth/client.ts` | `AuthClient`: `register`, `login`, `logout`, `getMe`, `patchMe`, `deleteMe` |
| `web/src/lib/auth/session.ts` | Nombres de cookie, `setSession`, `clearSession`, `readToken` |
| `web/src/lib/auth/return-to.ts` | `safeNext` |
| `web/src/lib/auth/actions.ts` | `loginAction`, `registerAction`, `logoutAction`, `patchMeAction`, `deleteMeAction` |
| `web/src/lib/auth/__tests__/` | Contrato, cliente con `fetch` mock, `safeNext`, actions |
| `web/src/components/auth/auth-screen.tsx` | Shell de dos columnas + pestañas + panel Club |
| `web/src/components/auth/login-form.tsx` | Email, contraseña, alerta, submit |
| `web/src/components/auth/register-form.tsx` | Cinco campos, alerta, submit |
| `web/src/components/account/account-view.tsx` | Cabecera, fichas, botones |
| `web/src/components/account/profile-drawer.tsx` | Drawer 460px |
| `web/src/components/account/delete-account-dialog.tsx` | `alertdialog` |
| `web/src/app/[locale]/ingresar/page.tsx` | RSC + `seoMetadata` |
| `web/src/app/[locale]/registro/page.tsx` | RSC + `seoMetadata` |
| `web/src/app/[locale]/cuenta/page.tsx` | RSC: cookie, `GET /me`, guardas |
| `web/src/components/layout/account-link.tsx` | Lee `sparks_signed_in` al montar. Hasta entonces, «Ingresar» |
| `web/src/components/layout/header.tsx` | El `Link` de ingresar pasa a ser `AccountLink` |
| `web/src/components/layout/footer.tsx` | Igual |
| `web/src/components/layout/mobile-menu.tsx` | Igual |
| `web/src/i18n/messages/{es,en}.json` | Namespace `auth` y `account` |
| `web/src/i18n/__tests__/messages.test.ts` | Allowlist si alguna clave coincide |
| `web/e2e/auth.spec.ts` | 200, h1, pestañas, sin alerta inicial |
| `web/e2e/helpers.ts` | Sumar las tres rutas a las que el smoke visita |

`routing.ts` no se toca. `/ingresar`, `/registro` y `/cuenta` ya están.

## 3 · Layout (del HTML del prototipo, 2026-09-25)

### Ingresar / registro

```
main  grid  colsSplit (1 col <lg/900; 1fr 1fr ≥900)
  left   pad clamp(42→70) / clamp(20→64)  flex col gap-26  max-w 640  justify center
    tabs   11px tracking 0.18em uppercase
           activa: text-ink border-b ink
           inactiva: text-text-meta, Link a la otra ruta
    h1     font-display clamp(32→52)  (= el clamp del proto, no un token nuevo)
    body   14px / 300 / text-text-body  max-w 44ch
    form   grid 1 col <md/700; 2 cols ≥700  gap-16
           TextInput. Email del registro: col-span-full ≥700
    alert  role=alert  text-danger  14px  justo arriba del botón  (si hay error)
    ButtonPrimary type=submit  (el proto no lo estira al 100%)
    foot   11.5px / 300 / text-text-meta   no es enlace
  right  bg-ink text-canvas  pad clamp(42→70) / clamp(20→56)
         GOLD_KICKER  Sparks Club
         h2 display clamp(24→40)
         beneficios 01–04  GOLD_INDEX + título 22px + desc 12.5px / 0.7
         divisor rgba(canvas, 0.16)
```

Los beneficios se reutilizan de `home.club` (mismas claves). No se duplica
el párrafo largo del banner: el panel del prototipo no lo trae.

### Cuenta

```
main  max-w 1180  mx-auto  pad clamp(34→56) / clamp(20→64) / clamp(64→110)
      flex col gap-34
  head  flex wrap  items-end  justify-between
    GOLD_KICKER  Socia desde {year}
    h1  display clamp(32→52)  Hola, {first_name}
    actions  flex wrap gap-10
      Editar perfil   ButtonPrimary compact
      Salir           borde hairline, min-h-11
      Eliminar cuenta borde danger/45, text-danger, hover bg-danger
  cards  grid auto-fit minmax(min(100%,150px),1fr)  gap-1px  bg hairline
         cada ficha bg-surface (canvas) pad 28
         k  mono 9.5 meta · v display 32 · note 12.5 / 300
```

Sin `h2` «Tus pedidos».

### Drawer de perfil

Igual que el carrito en mecánica (`useFocusTrap`, `useScrollLock`,
`slideIn`), con medidas del prototipo: 460px / 94vw, z-101, backdrop
`rgba(20,16,14,0.5)` z-100. Al abrirlo se cierra el overlay global
(`useUiStore.close`) para no apilar dos paneles a z-101.

Cabecera «Editar perfil». `h2` «Tus datos» 32px. Grilla de campos como
el formulario (`formCols`, gap 18×16). Nota de la contraseña debajo.
Pie `border-t ink`, dos botones 1fr 1fr: «Cancelar» y «Guardar cambios».
La alerta ocupa las dos columnas, arriba de los botones.

Escape y backdrop cierran. El foco vuelve al botón «Editar perfil».

### Diálogo de borrado

Backdrop z-102. Caja 480px / `calc(100vw - 32px)`, centrada, z-103,
`role="alertdialog"`, `aria-modal`, título enlazado con
`aria-labelledby`. Kicker en `text-danger` a 10px (no es oro; el proto
usa `#B4443A`). Botones: «Cancelar» y «Sí, eliminar» (`bg-danger`).
Escape = cancelar. La alerta va arriba de «Sí, eliminar».

## 4 · i18n

Namespace `auth` para las dos pantallas y `account` para la cuenta, el
drawer y el diálogo. Placeholders del prototipo (`camila@mail.com`,
`Camila`, `Ferrari`, `+54 9 11 …`, `••••••••`) también en el diccionario.

El año y el nombre son interpolación ICU (`{year}`, `{name}`, `{email}`,
`{phone}`, `{joined}`). `joined` se formatea en el servidor con
`Intl.DateTimeFormat` y el locale de la ruta (`es-AR` / `en`).

`home.club.benefits` se lee desde el panel; no se copia al namespace
`auth`.

## 5 · Datos / API

Cliente en `lib/auth/client.ts`. Base `API_BASE_URL` sin barra final.
`Authorization: Bearer <token>` en logout, `GET`/`PATCH`/`DELETE /me`.
Timeout razonable (10s) y cuerpo JSON. Un JSON que no cumple el Zod de
respuesta es un fallo genérico, no un render a medias.

| Action | Request | Éxito | Cookie |
|--------|---------|-------|--------|
| `loginAction` | `POST /auth/login` `{email, password}` | 200 `{access_token, token_type, must_change_password}` | set ambas |
| `registerAction` | `POST /auth/register` con los siete campos de 007 | 201 y luego login | set ambas sólo si el login es 200 |
| `logoutAction` | `POST /auth/logout` sin cuerpo | cualquier status | clear ambas, redirect catálogo |
| `patchMeAction` | `PATCH /me` con los cuatro campos | 200 `UserPublic` | no toca |
| `deleteMeAction` | `DELETE /me` | 204 | clear ambas, redirect catálogo |
| página cuenta | `GET /me` | 200 `UserPublic` | 401 → clear + redirect ingresar |

`UserPublic` del contrato: `id` (uuid), `first_name`, `last_name`,
`email`, `phone`, `active`, `must_change_password`, `terms_accepted_at`,
`created_at`, `updated_at`. Sin `password` ni `password_hash`.

### Validación

Un módulo puro `validateRegister` / `validateProfile` aplica las reglas
de RF-3 y devuelve el código del primer fallo. Lo usan el formulario
(para no ir a la red) y la action (RNF-2). El formulario recibe la
action por prop: en producción es la server action; el test pasa un
fake.

Registro arma el cuerpo así:

```txt
password_confirmation = password
accept_terms = true
email = trim + lower
first_name / last_name / phone = trim
```

Perfil: si `password` del drawer tiene algo que no sea vacío, la action
no se llama y el código es `password_unchanged_here`. Si está vacío, el
`PATCH` no incluye la clave.

### `safeNext`

Acepta sólo un path que:

- empiece con `/` y no con `//`
- no tenga `\` , `://` ni `@`
- después de decodificar siga cumpliendo eso
- cuelgue de `/${locale}/` de `es` o `en`
- no sea la ruta de ingresar ni la de registro

Si no, el catálogo de ese locale. Los `Link` a ingresar (header, menú,
footer, club) agregan `?next=` con `pathname` + search de la página
actual, armado en el cliente al hacer click **o** omitido: si el
enlace es un RSC `Link` sin search, el destino por defecto ya es el
catálogo (RF-2). Para volver a la página previa, `AccountLink` y los
CTA del club pasan `next` leído de `usePathname()`. Un `next` que ya
apunta a ingresar o registro se descarta.

### Cookies

| Nombre | HttpOnly | Valor |
|--------|----------|--------|
| `sparks_session` | sí | `access_token` |
| `sparks_signed_in` | no | `1` |

`SameSite=Lax`, `Path=/`, `Max-Age=21600`. `Secure` cuando
`NODE_ENV=production`. Borrar es `Max-Age=0` de las dos.

`AccountLink` (cliente) arranca como «Ingresar» y, tras montar, si
`document.cookie` contiene `sparks_signed_in=1`, pasa a «Mi cuenta»
hacia `/cuenta`. Mismo patrón que el contador del carrito (`hydrated`),
para no desajustar el HTML del servidor. Header, menú y footer lo usan
en lugar del `Link` fijo a `/ingresar`.

### 403 `password_change_required`

La página de cuenta, si `GET /me` es ese 403, no renderiza fichas ni
drawer ni borrado. Muestra el `h1` con un saludo genérico del
diccionario y un párrafo con el sentido del 403 (no el JSON crudo):
el usuario es correcto y tiene que cambiar la contraseña antes de
seguir. «Salir» sigue disponible y sólo borra cookies + catálogo
(el logout de 007 también responde 403 con el flag; RF-6 igual limpia).

No hay formulario de `POST /auth/change-password`.

### Errores de ingreso que no son 401

Red caída, timeout o 5xx: arriba del botón, «No pudimos iniciar sesión.
Intentá de nuevo.» / «We could not sign you in. Try again.» El texto
de credenciales incorrectas queda reservado al 401.

## 6 · Trade-offs

| Elección | Spec | Por qué | Coste |
|----------|------|---------|-------|
| Server actions, no `fetch` en la UI | RNF-1, ADR-0003 | El bearer no llega al navegador | La action hay que pasarla por prop para testear el formulario |
| Login inmediato tras el 201 | RF-3, decisión 2 | 007 no devuelve token y la cuenta exige sesión | Un registro que luego no puede loguear cae en ingresar |
| `password_confirmation` copiada y `accept_terms: true` | RF-1, RF-3 | El prototipo no tiene esos controles | No hay un segundo tipeo de la clave |
| Contraseña del drawer dibujada y no enviada | RF-7 | `extra=forbid` en `PATCH /me` | Quien la llene ve un error, no un cambio de clave |
| Fichas con correo / teléfono / alta | RF-5 | No hay API de pedidos ni de club | Se pierde el bloque «Tus pedidos» del proto |
| Cookie de presencia aparte | RF-4, AC-13, ADR-0012 | El layout sigue estático | Puede mentir hasta el próximo 401 |
| Gate sin API viva | RNF-5 | `web` no depende de `api` | El primer login real no lo cubre Vitest |

## 7 · Tests

Vitest, sin red. `fetch` mockeado en el cliente. Formularios con action
falsa.

| AC | Dónde |
|----|--------|
| AC-1, AC-2 | `auth-screen` + páginas: pestañas, h1, campos, panel, href de la otra ruta. Axe |
| AC-3 | `login-form`: action que devuelve `invalid_credentials` → alerta con el texto exacto, sin navegación |
| AC-4 | `return-to.test.ts` (next válido, `//evil`, `https://`, path de ingresar) y `actions` (200 llama `setSession` y el redirect es ese path o el catálogo) |
| AC-5 | `register-form`: nombre vacío, teléfono `11`, clave `admin123456` no invocan la action y muestran el mensaje |
| AC-6 | cliente: el cuerpo del register tiene los siete campos; action: 201 luego login; redirect a cuenta sólo si el login es 200 |
| AC-7 | action/form: 409 → «Ese correo ya está registrado.» |
| AC-8 | la página, con token ausente, redirige (test de la función de guarda, no del runtime de Next) |
| AC-9 | `account-view` con un `UserPublic` fixture: nombre, año, tres fichas; no está «VIP15» ni un id `SP-` |
| AC-10 | action de logout limpia cookies y redirige aunque el cliente tire o responda 500 |
| AC-11 | drawer: clave con texto no llama; clave vacía manda sólo cuatro claves; 200 cierra y pinta el usuario nuevo; 409 deja abierto |
| AC-12 | diálogo: confirmar llama delete; 204 limpia y redirige; 500 deja el texto de RF-8 |
| AC-13 | `account-link`: sin cookie «Ingresar»; con `sparks_signed_in=1` «Mi cuenta» y href `/cuenta` |
| AC-14 | axe en los tres estados (ingreso, registro, cuenta) y en drawer + diálogo abiertos. E2E de touch en mobile-360 cubre las rutas nuevas al entrar en el smoke |

E2E (`e2e/auth.spec.ts`): las tres URLs responden 200, un solo `h1`, la
alerta de ingreso no está al cargar, la pestaña cambia de ruta. No envía
el formulario: el servicio `e2e` no levanta `api`. El gate de
`.cursor/verify.json` no cambia.

Quien quiera probar el login de verdad levanta `db` y `api`, aplica
`alembic upgrade head` (el contenedor `api` no migra al arrancar) y entra
por el storefront. Eso no es parte del gate.

## 8 · Riesgos

| Riesgo | Qué lo contiene |
|--------|-----------------|
| Open redirect vía `next` | `safeNext` + test con `//`, esquema y backslash |
| Token en un log de la action | El cliente no loguea cuerpos ni el header `Authorization` |
| Admin semilla no puede usar `/cuenta` | RF-5 muestra el 403. La pantalla de cambio de clave queda fuera |
| `sparks_signed_in` queda en 1 con el token revocado | El 401 de `/cuenta` borra las dos |
| Register 201 y login 401 (carrera, usuario inactivo) | AC-6 manda a ingresar; no se abre `/cuenta` vacía |
| El drawer y el carrito comparten z-101 | Abrir el drawer cierra el overlay global |

## 9 · Fuera de este plan

- `POST /auth/change-password` y su UI.
- Pedidos, cupón, nivel.
- Pasar el catálogo a `API_MODE=http`.
- Migrar Alembic al arranque de `api`.
- Tocar `api/` para que haga `Set-Cookie`.
