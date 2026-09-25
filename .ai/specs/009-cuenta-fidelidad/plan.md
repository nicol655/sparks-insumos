# Plan técnico · 009 Fidelidad de `/cuenta`

- **Estado:** propuesto (2026-09-25)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0013](../../decisions/0013-cuenta-sin-datos-inventados.md).
  Reusa 0003 (la UI no hace `fetch`), 0009 (kicker oro 10px) y 0012
  (la página ya resuelve `GET /me` en el servidor).

## 1 · Enfoque

Un pase visual de la cuenta que ya existe. No hay cliente nuevo ni
campo nuevo en `UserPublic`. Las tres fichas dejan de leer correo,
teléfono y `created_at`; el valor es la clave de diccionario `-`.
Debajo se agrega el `h2` y el empty state en la medida de la fila del
prototipo (13.5px, padding 18px). La cabecera ajusta gaps y los tres
botones dejan `ButtonPrimary` y el alto de 44px: el prototipo es
padding 13×22 y tipo 11px.

El cursor es una regla en `theme.css`, no una clase en cada enlace.
`disabled:cursor-not-allowed` de `BUTTON_TYPE` sigue ganando: es una
utility y pisa la capa base.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `web/src/components/account/account-view.tsx` | Fichas de RF-1, bloque de pedidos, botones de RF-3 |
| `web/src/components/account/__tests__/account-view.test.tsx` | AC-1…AC-5 y AC-7 |
| `web/src/i18n/messages/es.json` | Etiquetas, notas, `-`, título y vacío |
| `web/src/i18n/messages/en.json` | Igual |
| `web/src/styles/theme.css` | `@layer base` del cursor (RF-4) |
| `web/src/styles/__tests__/cursor.test.ts` | AC-6, leyendo el CSS |

No se toca `api/`, `routing.ts`, el drawer, el diálogo, ni
`verify.json`. `emailLabel` / `phoneLabel` / `joinedLabel` se quedan:
el drawer y las fichas viejas no son el único lector posible, y
borrarlas no hace falta para esta spec. La página deja de usarlas.

## 3 · Layout

```
main   1180 hasta que el margen lateral superaría el de la captura;
       después crece (62vw + los dos gutters de 64px) para quedar ~19%
       adentro de cada borde. Pads y gap 34, los de 008.
  header   flex wrap items-end justify-between  gap 20
    título   flex col gap 10
      GOLD_KICKER
      h1
    actions  flex wrap gap 10
      tres botones  text-[11px] tracking-[0.16em] px-[22px] py-[13px]
  cards    border border-hairline bg-border-hairline
           grid auto-fit minmax(min(100%,150px),1fr) gap-px
           ficha bg-canvas px-7 py-7 gap-2
  orders   h2 font-display text-[32px] font-normal mb-[18px]
           div border-t border-ink
             p text-[13.5px] font-light py-[18px] border-b hairline
```

Los tres botones son `<button type="button">` con padding 13×22, tipo
11px y tracking 0.16em. No usan `BUTTON_TYPE` (`text-label` pisaría el
11px) ni `TOUCH_TARGET`. Editar: `border border-ink bg-ink text-canvas
hover:border-accent-gold hover:bg-accent-gold`. Salir: `border
border-border-strong hover:border-ink`. Eliminar: borde y texto danger,
hover con fondo danger.

`AccountCard` se queda, con tracking de la etiqueta a `0.16em`.

El bloque de pedidos y las fichas se renderizan sólo cuando hay
usuario y no hay `notice`. El estado bloqueado no cambia.

## 4 · i18n

Claves nuevas en `account`:

| Clave | es | en |
|-------|----|----|
| `missing` | - | - |
| `tierLabel` | Nivel | Tier |
| `tierNote` | Descuento aplicado automáticamente. | Discount applied automatically. |
| `couponLabel` | Cupón activo | Active coupon |
| `couponNote` | Acumulable con promos vigentes. | Stacks with current promos. |
| `ordersCountLabel` | Pedidos | Orders |
| `ordersCountNote` | Desde marzo de 2024. | Since March 2024. |
| `ordersTitle` | Tus pedidos | Your orders |
| `ordersEmpty` | Todavía no tenés pedidos. | You do not have any orders yet. |

`missing` es una clave a propósito idéntica en los dos idiomas. Si el
test de paridad la marca, entra en la allowlist con un comentario, no
se traduce el guion.

## 5 · Datos / API

Ninguno. `GET /me` sigue siendo la única lectura. Nivel, cupón y
cantidad de pedidos no se derivan de `created_at` ni de constantes.

## 6 · Cursor

Al final de `theme.css`:

```css
@layer base {
  a[href],
  button:not(:disabled),
  label,
  summary,
  [role="button"]:not([aria-disabled="true"]),
  [role="link"]:not([aria-disabled="true"]) {
    cursor: pointer;
  }
}
```

`button:disabled` no entra. `disabled:cursor-not-allowed` en
`BUTTON_TYPE` cubre el botón primario deshabilitado.

## 7 · Decisiones que no se reabren

| Elección | Por qué se queda |
|----------|------------------|
| Año del kicker desde `created_at` | Es un dato que la API sí devuelve (008) |
| `GOLD_KICKER` a 0.2em, no 0.22em | ADR-0009, token compartido |
| Nota en `text-muted`, etiqueta en `text-meta` | El PDF no tiene `#4A423B` ni `#8A8073` |
| Alto de 44px en estos botones | El padding 13×22 del prototipo manda en esta pantalla |
| Fila `1fr 2fr 1fr 1fr` sin implementar | No hay pedidos que pintar (ADR-0013) |

## 8 · Tests

`account-view.test.tsx` hoy afirma correo, teléfono, fecha y la
ausencia del `h2` de pedidos. Eso se invierte:

- AC-1: las tres etiquetas, tres `-`, las tres notas; `Club 5%`,
  `VIP15` y `07` ausentes en la página (el diálogo cerrado no pinta
  el cuerpo).
- AC-2: correo y teléfono ausentes en la página. El test del drawer
  no se toca: sigue viendo los campos del usuario.
- AC-3: `h2` y el empty state en es y en en. Ningún `SP-`.
- AC-4: los tres botones siguen abriendo drawer, logout y diálogo.
  Se afirman `py-[13px]`, `px-[22px]` y `text-[11px]`, y que no hay
  `min-h`.
- AC-5: `notice="locked"` no muestra fichas ni «Tus pedidos».
- AC-7: el año 2026 del fixture sigue en el kicker. Axe del estado
  con fichas y vacío.

`cursor.test.ts` lee `theme.css` como texto y espera el bloque de
RF-4, incluido el `:not(:disabled)`. No hace falta jsdom.

E2E de `auth.spec.ts` no entra a la cuenta con sesión (no hay API en
ese servicio). No se agrega. El gate sigue siendo el de `web` con
`--no-deps`.

## 9 · Riesgos

| Riesgo | Mitigación |
|--------|------------|
| «Desde marzo de 2024.» se lee como dato real | El valor es `-`. La nota queda porque el prototipo la trae y la spec la fija |
| La regla base pisa un `cursor` de un mapa o un control raro | El storefront no tiene mapas. `disabled:` sigue siendo utility |
| Alguien vuelve a pintar `Club 5%` «porque el proto lo dice» | ADR-0013 y AC-1 |
| El test de paridad de diccionarios rechaza `missing` | Allowlist, no una traducción distinta del guion |
