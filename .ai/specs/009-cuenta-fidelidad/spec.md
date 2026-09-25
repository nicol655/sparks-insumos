# 009 · Fidelidad de `/cuenta`

- **Estado:** aprobada (pedido de `/plan`, 2026-09-25)
- **Fecha:** 2026-09-25
- **Padre:** [008](../008-cuenta-storefront/spec.md) publicó la cuenta y
  reemplazó las fichas y la tabla del prototipo por correo, teléfono y
  fecha de alta (decisión 5). Esta spec revierte sólo ese recorte visual.
- **Fuente de diseño (única):** prototipo
  [`QUUhcHp24QBtXkUG8sHPDj`](https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj),
  pantalla `isAccount`, releída el 2026-09-25. Tokens, táctil y contraste
  siguen en el PDF y en ADR-0009.

## Problema

Con sesión, `/cuenta` no es la pantalla del prototipo. Muestra tres fichas
(correo, teléfono, alta) y no tiene «Tus pedidos». El prototipo muestra
Nivel, Cupón activo y Pedidos, y debajo el listado. Los botones de la
cabecera tampoco calzan el borde, el tracking ni el hover del prototipo.
En el storefront, enlaces, botones y etiquetas de acción no fuerzan
`cursor: pointer`.

## Objetivo

La cuenta con sesión se ve como el prototipo. Lo que `GET /me` no
devuelve no se inventa: el valor de esas fichas es `-` y el listado está
vacío. El año de «Socia desde» sigue saliendo de `created_at`.

## Alcance

### Dentro

1. Las tres fichas del prototipo, con valor `-`.
2. El bloque «Tus pedidos» con empty state. Sin filas ficticias.
3. Cabecera y botones de la cuenta alineados al prototipo, sin bajar
   de 44px de alto.
4. `cursor: pointer` en enlaces, botones y etiquetas que disparan una
   acción, en todo el storefront. Un control deshabilitado sigue con
   `cursor: not-allowed`.

### Fuera

- Pedidos, nivel o cupón reales. No hay endpoint. No se toca `api/`.
- Inventar `Club 5%`, `VIP15` o `07` como valores.
- Login, registro, drawer y diálogo de borrado (ya calzan el prototipo
  en 008). El cuerpo del diálogo sigue mencionando VIP15: es copy del
  prototipo, no un valor de ficha.
- Filas de pedido renderizadas. El diseño de la fila queda anotado para
  cuando exista la API; esta spec no la dibuja.
- Cambiar `GOLD_KICKER` (tracking 0.2em, ADR-0009) ni agregar el
  `#4A423B` / `#8A8073` del prototipo: la paleta del PDF no se extiende.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como socia veo las tres fichas del prototipo, con `-` donde la API no tiene el dato |
| US-2 | P0 | Como socia veo «Tus pedidos» vacío, sin pedidos inventados |
| US-3 | P0 | Como socia reconozco la cabecera del prototipo (kicker, saludo, tres botones) |
| US-4 | P0 | Como visitante, un enlace, un botón o una etiqueta de acción muestra la manito |

## Requisitos

### RF-1 · Fichas

Con sesión y sin aviso de cuenta bloqueada, una sola grilla. Tres fichas,
en este orden. El valor visible es el carácter `-` (guion). No se muestra
el valor del prototipo.

| Orden | Etiqueta es | Etiqueta en | Nota es | Nota en |
|-------|-------------|-------------|---------|---------|
| 1 | Nivel | Tier | Descuento aplicado automáticamente. | Discount applied automatically. |
| 2 | Cupón activo | Active coupon | Acumulable con promos vigentes. | Stacks with current promos. |
| 3 | Pedidos | Orders | Desde marzo de 2024. | Since March 2024. |

La nota de Pedidos es copy del prototipo. No es la fecha de alta del
usuario. El valor sigue siendo `-`.

Layout del prototipo: grilla `auto-fit` / `minmax(min(100%, 150px), 1fr)`,
separación de 1px, fondo y borde `border-hairline`, cada ficha con
padding 28px. Etiqueta mono 9.5px, tracking 0.16em, `text-meta`. Valor
display 32px. Nota 12.5px, peso 300, `text-muted` (el `#4A423B` del
prototipo no es un token).

Correo, teléfono y fecha de alta salen de esta grilla. Siguen en el
drawer.

### RF-2 · Tus pedidos

Debajo de las fichas, sólo con sesión usable:

- `h2` «Tus pedidos» / «Your orders», display 32px, peso 400, margen
  inferior 18px. Sin interlineado propio.
- Una regla superior de 1px `ink`.
- Empty state, sin filas: «Todavía no tenés pedidos.» / «You do not have
  any orders yet.» Ocupa la fila del prototipo: 13.5px, peso 300, padding
  vertical 18px, borde inferior hairline. No es un enlace.

No aparecen `SP-10412`, `SP-10388` ni `SP-10301`.

La fila del prototipo (de 700px: `1fr 2fr 1fr 1fr`; debajo, una columna)
no se implementa hasta que una API de pedidos exista.

### RF-3 · Cabecera

Se mantiene el kicker «Socia desde {año}» con el año UTC de `created_at`,
y el `h1` «Hola, {first_name}».

Espaciado del prototipo: 20px entre el bloque del título y los botones;
10px entre botones; 10px entre kicker y `h1`.

Los tres botones, a 11px, tracking 0.16em, padding 13px 22px, sin alto
mínimo (el del prototipo), `cursor: pointer`:

| Botón | Reposo | Hover |
|-------|--------|-------|
| Editar perfil | fondo y borde `ink`, texto canvas | fondo y borde `accent-gold` |
| Salir | borde `border-strong`, texto `ink` | borde `ink` |
| Eliminar cuenta | borde `danger` al 45%, texto `danger` | fondo `danger`, texto canvas |

No usan `ButtonPrimary`: el compacto de §03 es 15×28px y tracking 0.2em,
y el prototipo de esta pantalla no.

Cuenta bloqueada o no disponible: igual que 008. Sin fichas, sin
«Tus pedidos», sin editar ni eliminar. «Salir» sigue.

### RF-4 · Cursor

En todo `web/`: un enlace con `href`, un `button` habilitado, un
`summary`, un `[role="button"]` o `[role="link"]` habilitado, y un
`label`, usan `cursor: pointer`. Un `button` deshabilitado, o un control
con `aria-disabled="true"`, usa `cursor: not-allowed`.

No se pone la manito en títulos, fichas ni en el empty state.

## Requisitos no funcionales

| # | Requisito |
|---|-----------|
| RNF-1 | No se toca `api/`. No hay request nuevo. Los tests no pegan a una API viva |
| RNF-2 | Copy en los dos diccionarios. Sin cadenas literales en componentes |
| RNF-3 | Contraste de 001. Kicker oro a 10px (ADR-0009). En esta pantalla el kicker lleva tracking 0.22em, como el prototipo. Los tres botones usan el padding del prototipo, no el alto de 44px |
| RNF-4 | El gate de `web` sigue con `--no-deps`. No se cambia `verify.json` |

## Criterios de aceptación

| # | Criterio |
|---|----------|
| AC-1 | Con un usuario de prueba, la cuenta muestra Nivel, Cupón activo y Pedidos, cada valor igual a `-`, y las notas de RF-1. No muestra `Club 5%`, `VIP15` ni `07` |
| AC-2 | No muestra el correo, el teléfono ni la fecha de alta en las fichas. El drawer sigue mostrándolos |
| AC-3 | Hay un `h2` «Tus pedidos» / «Your orders» y el empty state de RF-2. No hay filas `SP-` |
| AC-4 | «Editar perfil», «Salir» y «Eliminar cuenta» conservan su acción (drawer, logout, diálogo). Padding 13px 22px, tipo 11px, sin `min-h` |
| AC-5 | Cuenta bloqueada: saludo de 008, «Salir», y ni fichas ni «Tus pedidos» |
| AC-6 | Enlaces, botones habilitados y `label` del storefront declaran `cursor: pointer`. Un botón deshabilitado declara `not-allowed` |
| AC-7 | El año del kicker sigue siendo el de `created_at`. Axe del componente abierto no suma violaciones critical/serious (el kicker oro sigue exceptuado) |

## Cerrado el 2026-09-25

1. **Valores ausentes.** `-`, no el texto del prototipo y no un em dash.
2. **Notas.** Se conservan, incluida «Desde marzo de 2024.». No se
   sustituyen por la fecha de `created_at`.
3. **Empty state.** La frase es nueva (el prototipo no tiene vacío). La
   caja es la de una fila: 13.5px, peso 300, padding 18px.
4. **Fila de pedido.** No se construye en esta spec.
5. **Cursor.** Una regla de base, no una clase repetida en cada componente.
