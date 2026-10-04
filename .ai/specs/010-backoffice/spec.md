# 010 · Backoffice (login y guarda)

- **Estado:** aprobada (pedido de `/plan`, 2026-09-28).
  RF-7 y AC-9 (panel en blanco) los reemplaza
  [011](../011-backoffice-cascaron/spec.md).
- **Fecha:** 2026-09-28
- **Padre:** [007](../007-api-autenticacion/spec.md) publica las cuentas.
  [008](../008-cuenta-storefront/spec.md) las usa en la tienda. Esta spec
  no cambia ni `web/` ni `api/`.
- **Fuente visual:** captura adjunta el 2026-09-28 (panel partido, marca a
  la izquierda, formulario a la derecha). Es un ejemplo de composición.
  Textos, marca y colores son los de Sparks, no los de esa captura.

## Problema

No hay herramienta interna. La tienda ya inicia sesión contra las mismas
cuentas (`POST /auth/login`), pero no existe un servicio aparte para el
backoffice ni una pantalla que impida recorrer secciones sin sesión.

## Objetivo

Publicar un servicio web nuevo, en su propio contenedor Docker, con el
login de esa composición en la paleta de Sparks. Quien no tiene sesión no
entra a ninguna sección: ve una página de no autorizado con un enlace de
vuelta a `/login`. Un login correcto deja el token en el navegador y abre
un panel vacío.

## Alcance

### Dentro

1. Servicio `backoffice/`: React, Next.js, TypeScript, Tailwind y Zustand.
   Contenedor Docker llamado `sparks-backoffice`, un servicio más del stack.
2. Pantalla `/login` con la composición de la captura (dos columnas en
   escritorio, formulario usable en angosto) y la paleta de la tienda
   (tinta `#14100E`, hueso `#F5F1EA`, oro `#8A6B32`).
3. El login llama al mismo `POST /auth/login` que la tienda. Sirven los
   mismos usuarios. No hay otro directorio de cuentas.
4. Token de sesión en Zustand, persistido en `sessionStorage`.
5. Guarda: sin sesión, cualquier sección manda a `/unauthorized`.
6. `/unauthorized` muestra el mensaje de abajo y un enlace a `/login`.
7. Login correcto redirige a `/dashboard`. Esa página está en blanco.
8. Tests de unidad (Vitest) para cada criterio de abajo.

### Fuera

- Roles y permisos. 007 no los tiene. Cualquier login 200 entra. Un rol
  de operador queda para otra spec.
- Cambio de contraseña (`POST /auth/change-password`). Si el login responde
  200 con `must_change_password: true`, igual se abre `/dashboard`.
- Registro, logout, recuperación de contraseña, «olvidaste tu contraseña».
  No hay endpoint de reseteo y no se dibuja un control muerto.
- Contenido del panel: menú, listados, pedidos. `/dashboard` no pinta nada.
- i18n. El backoffice es sólo español, sin prefijo `/es`.
- Tocar `web/`, el contrato de 007, o hacer que `api/` envíe `Set-Cookie`.
- Playwright. Esta rebanada se prueba con unidad.

## Rutas

Sin prefijo de idioma.

| Ruta | Quién | Qué pasa |
|------|--------|----------|
| `/login` | Público | Formulario. Si ya hay sesión, va a `/dashboard` |
| `/unauthorized` | Público | Mensaje + enlace a `/login`. Si ya hay sesión, va a `/dashboard` |
| `/` | Sesión | Va a `/dashboard`. Sin sesión, a `/unauthorized` |
| `/dashboard` | Sesión | Página en blanco. Sin sesión, a `/unauthorized` |
| Cualquier otra | Sesión | Sin sesión, a `/unauthorized` |

`/login` y `/unauthorized` son las únicas rutas públicas. Si la guarda
exigiera sesión para ver «no autorizado», el enlace a `/login` no se
podría abrir.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como operador levanto el backoffice en Docker, al lado del resto del stack |
| US-2 | P0 | Como usuario de la tienda inicio sesión con el mismo correo y contraseña |
| US-3 | P0 | Como visitante sin sesión no recorro secciones: veo que no estoy autorizado y vuelvo al login |
| US-4 | P0 | Como usuario con sesión llego a un panel en blanco |

## Requisitos

### RF-1 · Servicio

- Carpeta `backoffice/` autocontenida (Dockerfile, compose propio,
  `.dockerignore`, `.env.example`), orquestada desde `docker/`.
- El contenedor del servicio en marcha se llama `sparks-backoffice`.
- Levantar sólo `web/` no depende de este servicio. Los tests de unidad
  no necesitan `api/` ni la base.

### RF-2 · Login

- Campos: correo y contraseña. La contraseña se puede mostrar u ocultar.
- Botón de envío. No hay enlace de recuperación.
- Columna izquierda: marca Sparks (backoffice), no la marca de la captura.
  Las tres líneas de abajo son texto, no enlaces: perfumería, mayorista
  en Franklin, pago en efectivo o transferencia.
- Columna derecha: título «Iniciar sesión», etiquetas de correo y
  contraseña, botón «Entrar». Fondo hueso, botón tinta (el hover de oro
  ya es el del botón primario de la tienda).
- En angosto (una columna) el formulario sigue siendo usable. La marca
  puede apilarse encima; no se pierde el botón ni los campos.
- Placeholder de correo: `nombre@sparksinsumos.com`. No es una cuenta.

### RF-3 · Misma cuenta que la tienda

- Cuerpo: `{ "email", "password" }`, correo recortado y en minúsculas.
- Éxito: 200 con `access_token`, `token_type: "bearer"` y
  `must_change_password`.
- 401 (`invalid_credentials`): mismo mensaje para clave mala, correo
  desconocido o usuario inactivo. Texto: «Credenciales inválidas». No se
  guarda token. Se queda en `/login`.
- Red, timeout o 5xx: «No pudimos iniciar sesión. Intentá de nuevo.»
- Correo o contraseña vacíos: no se llama a la red. Texto: «Completá
  correo y contraseña.»

### RF-4 · Sesión

- El token y el flag `must_change_password` viven en un store de Zustand
  persistido en `sessionStorage` (clave `sparks-backoffice-session`).
- No se escriben en `localStorage` ni en una cookie.
- Un 200 es login correcto aunque `must_change_password` sea true.
- Cerrar la pestaña tira la sesión del navegador. El plazo de 6 horas del
  token sigue siendo el de 007; esta spec no lo alarga.

### RF-5 · Guarda

- Hasta que el store haya rehidratado `sessionStorage`, no se redirige
  (evita mandar al login a quien sí tiene sesión).
- Sin token rehidratado, toda ruta que no sea `/login` ni `/unauthorized`
  va a `/unauthorized`.
- Con token, `/login`, `/unauthorized` y `/` van a `/dashboard`.
- El panel no se protege en el servidor: `sessionStorage` no existe ahí.
  El HTML de `/dashboard` en esta spec está vacío, así que no filtra datos.

### RF-6 · No autorizado

- Ruta `/unauthorized`.
- Título visible: «No autorizado».
- Mensaje exacto: «No podés entrar a esta sección sin iniciar sesión.»
- Enlace visible «Ir a iniciar sesión» con href `/login`.

### RF-7 · Panel

- Login correcto → `/dashboard`.
- Con sesión, la página no muestra secciones, listas ni formularios.
  Un `main` vacío alcanza.

## Requisitos no funcionales

| # | Requisito |
|---|-----------|
| RNF-1 | Misma paleta que la tienda. No se introducen el azul ni el gris de la captura de ejemplo |
| RNF-2 | El bearer no se loguea. El cliente HTTP no imprime el cuerpo ni `Authorization` |
| RNF-3 | Secretos fuera del repo. La URL de `api/` sale del entorno |
| RNF-4 | Cada AC tiene un test de unidad. El gate del servicio corre en Docker, sin Node en el host |
| RNF-5 | TypeScript estricto, como `web/` |

## Criterios de aceptación

| # | Criterio |
|---|----------|
| AC-1 | El compose del stack define el servicio y el contenedor `sparks-backoffice`. Un test lee esos archivos |
| AC-2 | `/login` muestra «Iniciar sesión», correo, contraseña, «Entrar» y la marca Sparks. No aparece el nombre ni el correo de la captura de ejemplo. Las tres líneas de la columna izquierda no son enlaces |
| AC-3 | Enviar el formulario llama al login con correo en minúsculas y la contraseña. Vacío no llama y muestra «Completá correo y contraseña.» |
| AC-4 | Un 200 guarda `access_token` en el store y la persistencia usada es `sessionStorage`, no `localStorage`. La navegación siguiente es `/dashboard` |
| AC-5 | Un 401 muestra «Credenciales inválidas», no guarda token y no navega. Un fallo de red muestra «No pudimos iniciar sesión. Intentá de nuevo.» |
| AC-6 | Un 200 con `must_change_password: true` también guarda el token y va a `/dashboard` |
| AC-7 | La función de guarda: sin sesión, `/`, `/dashboard` y una ruta cualquiera devuelven `/unauthorized`; `/login` y `/unauthorized` no redirigen. Con sesión, esas dos y `/` devuelven `/dashboard`. Antes de rehidratar, no hay redirect |
| AC-8 | `/unauthorized` muestra el título «No autorizado», el mensaje exacto de RF-6 y un enlace a `/login` |
| AC-9 | Con sesión, `/dashboard` renderiza un `main` vacío: no hay menú ni otra sección |

## Cerrado el 2026-09-28

1. «Mensaje X» del pedido queda en la frase de RF-6. Si el negocio quiere
   otra, se cambia esa frase y el test de AC-8.
2. «Endpoints de users» = `POST /auth/login` de 007, el mismo que usa la
   tienda. No existe un recurso `/users` y no se inventa.
3. Sin rol de operador en esta spec.
4. El admin semilla puede entrar al panel en blanco aunque después `GET /me`
   responda 403. No hay pantalla de cambio de clave.
5. Español fijo, rutas tal como están escritas arriba.

## Preguntas abiertas

Ninguna que bloquee el plan.
