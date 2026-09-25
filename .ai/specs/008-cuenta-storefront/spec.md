# 008 · Cuenta en el storefront

- **Estado:** aprobada (pedido de `/plan`, 2026-09-25)
- **Fecha:** 2026-09-25
- **Padre:** [001](../001-storefront-fase-1/spec.md) dejó login, registro y
  cuenta para Fase 2. [007](../007-api-autenticacion/spec.md) publicó los
  endpoints y **no** tocó `web/`.
- **Fuente de diseño (única):** prototipo
  [`QUUhcHp24QBtXkUG8sHPDj`](https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj),
  releído el 2026-09-25 (pantallas `login`, `register`, `account`, drawer
  `profileOpen` y diálogo `deleteOpen`). Reemplaza cualquier lectura anterior
  de esas tres pantallas. Tokens, táctil y contraste siguen en el PDF y en
  ADR-0009.

## Problema

`/es/ingresar`, `/es/registro` y `/es/cuenta` (y sus pares en inglés) caen
en el catch-all y responden 404. El chrome, el club y el footer ya enlazan
ahí. `api/` ya registra, inicia sesión y expone `/me`, pero el storefront
no la llama.

## Objetivo

Publicar las tres pantallas fieles al prototipo y conectarlas a los
endpoints de 007. La sesión del navegador vive en cookies. El catálogo
sigue en `API_MODE=mock`.

## Alcance

### Dentro

1. Pantalla de ingreso, pantalla de registro y pantalla de cuenta, con el
   layout y la copy del prototipo (más abajo).
2. `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`,
   `GET /me`, `PATCH /me` y `DELETE /me`.
3. Validación en el cliente de las mismas reglas de DTO que 007, antes de
   llamar a la red.
4. Cookie de sesión. El bearer no se escribe en `localStorage` ni en una
   cookie legible por script.
5. El enlace «Ingresar» del header, del menú móvil y del footer pasa a
   «Mi cuenta» cuando hay sesión.

### Fuera

- Cambio de contraseña (`POST /auth/change-password`) y la pantalla para
  apagar `must_change_password`. El flag se **muestra** si `GET /me`
  responde 403; no se resuelve aquí.
- «¿Olvidaste tu contraseña?» es copy del prototipo. No hay endpoint de
  recuperación. No se inventa un `wa.me` de reseteo.
- Pedidos, nivel Club, cupón VIP15. `GET /me` no los devuelve. No se
  pintan los pedidos ficticios del prototipo (`SP-10412`, etc.).
- Roles, catálogo por HTTP, cupón (T083), contacto con POST.
- Cambiar el contrato de 007 (la API no pasa a devolver `Set-Cookie`).

## Rutas

El pedido nombra `/ingresar`, `/registrar` y `/me`. En el storefront eso
queda así (rutas ya reservadas en `routing.ts`; no se inventan slugs):

| Pedido | Español | Inglés | API |
|--------|---------|--------|-----|
| Ingresar | `/es/ingresar` | `/en/sign-in` | `POST /auth/login` |
| Registrar | `/es/registro` | `/en/register` | `POST /auth/register` |
| Cuenta (`/me` es el recurso) | `/es/cuenta` | `/en/account` | `GET` / `PATCH` / `DELETE /me` |

`/registrar` y `/me` como pathnames de página no se crean. El club, el
header y el footer ya apuntan a `/registro` e `/ingresar`.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como visitante ingreso con correo y contraseña y vuelvo a donde estaba |
| US-2 | P0 | Como visitante creo una cuenta y aterrizo en mi cuenta |
| US-3 | P0 | Como usuario veo los datos que devuelve `GET /me` |
| US-4 | P0 | Como usuario cierro sesión y vuelvo al catálogo |
| US-5 | P0 | Como usuario edito mis datos desde el drawer y los veo actualizados |
| US-6 | P0 | Como usuario elimino mi cuenta después de confirmarlo y vuelvo al catálogo |

## Requisitos

### RF-1 · Diseño de ingresar y registro

Una sola composición, dos rutas. A partir de 900px, dos columnas; debajo,
una. Izquierda: pestañas «Ingresar» / «Crear cuenta» (la activa en tinta
con subrayado de 1px; la otra en meta), `h1`, bajada, campos, botón,
nota al pie. Derecha (panel ink): kicker Sparks Club, título del club y
los cuatro beneficios `01`–`04` ya usados en la home.

Campos del prototipo, en este orden:

| Ruta | Campos |
|------|--------|
| Ingresar | Email, Contraseña |
| Registro | Nombre, Apellido, Email (ancho completo), Teléfono / WhatsApp, Contraseña |

No hay segundo campo de contraseña ni casilla de términos. La nota al pie
del registro es la aceptación («Al registrarte aceptás…»). El pie de
ingreso («¿Olvidaste tu contraseña?…») no es un enlace.

Copy visible: la del prototipo (`loginTitle`, `regTitle`, y el resto del
bloque `es` / `en` releído el 2026-09-25). Oro de kicker a 10px
(ADR-0009). Controles interactivos con alto mínimo 44px.

### RF-2 · Ingreso

- Submit llama a `POST /auth/login` con correo y contraseña.
- 200: se guarda la sesión en cookie y se redirige al `next` interno
  (la página del storefront de la que vino). Si no hay `next`, o no es
  una ruta de este sitio, se redirige al catálogo
  (`/es/catalogo` · `/en/catalogue`).
- 401: no se redirige. Justo arriba del botón «Ingresar» se muestra, en
  español, el texto exacto **«Los datos introducidos son incorrectos»**.
  En inglés, «The details you entered are incorrect.»
- Un 200 con `must_change_password: true` es un ingreso correcto: misma
  cookie y misma redirección. Esta spec no abre la pantalla de cambio
  de clave.

`next` sólo puede ser un path del propio sitio (empieza con `/`, un solo
slash, sin esquema ni host). `/ingresar` y `/registro` no son destinos
válidos. Cualquier otro valor se trata como «no es la web» y va al
catálogo.

### RF-3 · Registro

- El botón «Crear cuenta» valida en el cliente las reglas de DTO de 007
  (tabla de abajo) **antes** de la red. Si algo falla, no hay request.
  El primer dato inválido, en el orden del formulario, se anuncia en un
  solo mensaje justo arriba del botón.
- Si la validación pasa, `POST /auth/register`. El cuerpo lleva
  `password_confirmation` igual a la contraseña única del formulario y
  `accept_terms: true` (la nota al pie es la aceptación; el prototipo no
  tiene casilla).
- 201: el alta de 007 no trae token. El servidor de Next, con el mismo
  correo y la misma contraseña, llama enseguida a `POST /auth/login`.
  Si ese login es 200, guarda la cookie y redirige a `/cuenta`. Si el
  login no es 200, no deja una cuenta a medias: manda a ingresar con
  `next` hacia la cuenta. La contraseña no se guarda.
- 409 `email_taken` y cualquier otro fallo de la API: un mensaje justo
  arriba de «Crear cuenta», sin redirección. El login de cortesía no
  se llama.

Reglas (las mismas que `RegisterRequest` / `validate_password`):

| Dato | Regla |
|------|--------|
| Nombre, apellido | Tras `trim`, 1 a 80 caracteres |
| Correo | Tras `trim` y minúsculas, contiene `@` y no empieza ni termina en `@` |
| Teléfono | Tras `trim`, 6 a 32, empieza con `+`, al menos un dígito |
| Contraseña | 8 a 128; mayúscula, minúscula, número y un carácter que no sea letra ni número; sin espacios |

Mensajes (un solo `role="alert"` arriba del botón):

| Caso | es | en |
|------|----|----|
| Nombre | El nombre es obligatorio y tiene hasta 80 caracteres. | First name is required and must be at most 80 characters. |
| Apellido | El apellido es obligatorio y tiene hasta 80 caracteres. | Last name is required and must be at most 80 characters. |
| Correo | El correo no es válido. | The email address is not valid. |
| Teléfono | El teléfono tiene que empezar con + y tener entre 6 y 32 caracteres. | The phone number must start with + and be 6 to 32 characters. |
| Contraseña | La contraseña tiene que tener entre 8 y 128 caracteres, una mayúscula, una minúscula, un número y un símbolo, sin espacios. | The password must be 8 to 128 characters and include an uppercase letter, a lowercase letter, a number and a symbol, with no spaces. |
| Correo ya usado | Ese correo ya está registrado. | That email is already registered. |
| Otro fallo de red o 5xx | No pudimos crear la cuenta. Intentá de nuevo. | We could not create the account. Try again. |

### RF-4 · Sesión

- Tras un login 200 la cookie de sesión existe y viaja en las llamadas
  autenticadas. No es legible desde JavaScript de la página.
- Dura 6 horas, igual que `SESSION_TTL_SECONDS`.
- Logout y borrado de cuenta la eliminan aunque la API falle.
- Un 401 en `/cuenta` borra la cookie y manda a ingresar.

### RF-5 · Cuenta

`/cuenta` sin sesión redirige a ingresar con `next` apuntando a la cuenta.

Con sesión, `GET /me` y se muestra:

- Kicker «Socia desde {año}» / «Member since {year}», con el año de
  `created_at` (no el «2024» fijo del prototipo).
- `h1` «Hola, {first_name}» / «Hello, {first_name}».
- Tres fichas con datos reales: correo, teléfono y fecha de alta. No se
  muestran «Club 5%», «VIP15» ni «07».
- Botones «Editar perfil», «Salir» y «Eliminar cuenta».
- Sin la tabla «Tus pedidos».

Si `GET /me` responde 403 `password_change_required`, la página muestra
ese hecho (el usuario es correcto y todavía no puede usar la cuenta) y
no abre el drawer ni el borrado. «Salir» igual borra la cookie local y
vuelve al catálogo.

### RF-6 · Salir

«Salir» llama a `POST /auth/logout`, borra las cookies de sesión y
redirige al catálogo. El borrado de cookies no espera a que el logout
responda bien: si la API falla, la cookie igual se va y hay redirección.

### RF-7 · Editar

«Editar perfil» abre el drawer del prototipo (460px, panel derecho,
fondo, foco atrapado, Escape cierra). Campos: nombre, apellido, correo,
teléfono y contraseña, más la nota «Dejá la contraseña vacía…».

«Guardar cambios»:

- Contraseña no vacía: no hay `PATCH`. Mensaje arriba del botón: «La
  contraseña no se cambia desde acá.» / «The password cannot be changed
  here.»
- Si no, valida nombre, apellido, correo y teléfono con las reglas de
  RF-3. El primer fallo se muestra arriba de «Guardar cambios».
- Si pasan, `PATCH /me` sólo con esos cuatro campos.
- Fallo de API (409 u otro): un mensaje arriba de «Guardar cambios». El
  drawer sigue abierto. 409 usa el texto de «correo ya usado» de RF-3.
  Cualquier otro fallo: «No pudimos guardar los cambios.» / «We could
  not save your changes.»
- 200: el drawer se cierra y la página muestra los valores nuevos (los de
  la respuesta, sin un segundo `GET`).

### RF-8 · Eliminar cuenta

«Eliminar cuenta» abre el diálogo del prototipo (`role="alertdialog"`):
kicker «Acción irreversible», título «¿Eliminar tu cuenta?», el cuerpo
del prototipo, «Cancelar» y «Sí, eliminar».

«Sí, eliminar» llama a `DELETE /me`. 204: se borran las cookies y se
redirige al catálogo. Otro resultado: el diálogo sigue abierto y arriba
de «Sí, eliminar» se muestra «No pudimos eliminar la cuenta.» / «We
could not delete the account.»

## Requisitos no funcionales

| # | Requisito |
|---|-----------|
| RNF-1 | El bearer no aparece en el HTML, en `localStorage` ni en una cookie que el script de la página pueda leer |
| RNF-2 | Validar de nuevo en el servidor de Next antes de llamar a `api/`. El cliente no es la única barrera |
| RNF-3 | Copy en los dos diccionarios. Sin cadenas literales en componentes (la regla `no-literal-string` sigue en error) |
| RNF-4 | Un `next` mal formado no puede enviar a otro sitio |
| RNF-5 | El gate de `web` sigue sin depender de `api/` (`--no-deps`). Los tests de esta spec no pegan a una API viva |
| RNF-6 | Contraste y táctil de 001. Kickers oro a 10px (ADR-0009). El rojo de borrar es `--color-danger` |

## Criterios de aceptación

| # | Criterio |
|---|----------|
| AC-1 | `/es/ingresar` y `/en/sign-in` muestran las pestañas, el `h1` «Bienvenida de vuelta.» / «Welcome back.», email, contraseña, el botón «Ingresar» / «Sign in» y el panel Sparks Club. No hay alerta de error al entrar |
| AC-2 | `/es/registro` y `/en/register` muestran «Creá tu cuenta.» / «Create your account.», los cinco campos del prototipo y «Crear cuenta» / «Create account». La pestaña correspondiente está activa y enlaza a la otra ruta |
| AC-3 | Un login 401 deja al usuario en la página y muestra «Los datos introducidos son incorrectos» justo arriba del botón, en español |
| AC-4 | Un login 200 guarda la cookie de sesión (no legible por el script de la página) y redirige al `next` interno. Sin `next` válido, al catálogo. Un `next` con host u otro origen va al catálogo |
| AC-5 | Registro con nombre vacío, teléfono sin `+` o contraseña fuera de política no llama a la red y muestra el mensaje de RF-3 arriba de «Crear cuenta» |
| AC-6 | Registro válido hace `POST /auth/register` con `accept_terms: true` y `password_confirmation` igual a `password`. Tras un 201, un login con las mismas credenciales guarda la cookie y redirige a `/cuenta`. Si ese login no es 200, redirige a ingresar con `next` hacia la cuenta |
| AC-7 | Un 409 en el registro muestra «Ese correo ya está registrado.» arriba del botón y no redirige |
| AC-8 | `/cuenta` sin cookie redirige a ingresar con `next` de vuelta a la cuenta |
| AC-9 | Con sesión, la cuenta muestra `first_name` en el `h1`, el año de `created_at`, correo, teléfono y la fecha de alta. No muestra pedidos ni «VIP15» |
| AC-10 | «Salir» llama a `POST /auth/logout`, borra las cookies y redirige al catálogo aunque el logout no sea 204 |
| AC-11 | «Guardar cambios» con la contraseña vacía y datos válidos hace `PATCH /me` con sólo los cuatro campos. 200 cierra el drawer y actualiza lo visible. Un 409 muestra el error arriba del botón y deja el drawer abierto. Contraseña no vacía no llama a `PATCH` |
| AC-12 | «Sí, eliminar» llama a `DELETE /me`. 204 borra las cookies y redirige al catálogo. Un fallo deja el diálogo abierto con el mensaje de RF-8 |
| AC-13 | Con la cookie de presencia, header, menú y footer muestran «Mi cuenta» hacia `/cuenta` en lugar de «Ingresar» |
| AC-14 | Las tres rutas pasan axe sin critical/serious (salvo el kicker oro ya exceptuado) y los controles hacen 44px a 360px |

## Cerrado el 2026-09-25

1. **Rutas.** Se usan las ya reservadas (`/registro`, `/cuenta`), no
   `/registrar` ni `/me` como pathname. `/me` es sólo el recurso de la API.
2. **Alta sin token.** 007 responde 201 sin bearer. Para cumplir la
   redirección a la cuenta, el servidor de Next hace `POST /auth/login`
   con las mismas credenciales y recién ahí abre `/cuenta`. Si ese login
   falla, el destino es ingresar con `next` hacia la cuenta.
3. **Un solo campo de contraseña y sin casilla.** El prototipo manda. El
   cliente completa `password_confirmation` y `accept_terms` al armar el
   cuerpo.
4. **Contraseña del drawer.** Se dibuja, como en el prototipo. Si viene
   con texto, no se envía: `PATCH /me` rechazaría el campo (`extra=forbid`)
   y 007 no cambia la clave por ahí.
5. **Pedidos y fichas de club.** No se inventan. Las tres fichas son
   correo, teléfono y alta. [009](../009-cuenta-fidelidad/spec.md) y
   ADR-0013 reemplazan este recorte: las fichas del prototipo se dibujan
   con `-` y «Tus pedidos» queda vacío.
6. **Cookie.** El token es httpOnly. Una segunda cookie, sin el token,
   sólo le dice al chrome si hay sesión. Ver ADR-0012.

## Preguntas abiertas

Ninguna.
