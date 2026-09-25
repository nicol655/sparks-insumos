# Tasks · 009 Fidelidad de `/cuenta`

- **Estado:** cerrada (T287–T292)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0013](../../decisions/0013-cuenta-sin-datos-inventados.md)

No se toca `api/` ni `verify.json`. Los tests no pegan a una API viva.
El valor ausente es `-`, nunca `Club 5%`, `VIP15` ni `07`.

## Setup

- [x] **T287 · Diccionario** → RF-1, RF-2, RNF-2
  Claves `missing`, `tierLabel`, `tierNote`, `couponLabel`, `couponNote`,
  `ordersCountLabel`, `ordersCountNote`, `ordersTitle`, `ordersEmpty` en
  `account` de `messages/{es,en}.json`. `account.missing` es `-` en los dos
  idiomas: va a la allowlist de paridad, no se traduce.
  Archivos: `web/src/i18n/messages/{es,en}.json`,
  `web/src/i18n/__tests__/messages.test.ts`.

## Foundational

- [x] **T288 · Cursor** `[P]` → RF-4, AC-6
  Puede ir en paralelo con T287.
  Test primero: `web/src/styles/__tests__/cursor.test.ts` lee `theme.css`
  y espera `cursor: pointer` en `a[href]`, `button:not(:disabled)`, `label`,
  `summary` y los roles habilitados, y `cursor: not-allowed` en
  `button:disabled` y `[aria-disabled="true"]`.
  Archivos: `web/src/styles/theme.css`, el test.

## US-1 · Fichas

- [x] **T289 · Tres fichas con guion** → US-1, RF-1, AC-1, AC-2, AC-7
  Depende de T287.
  Test primero en `account-view.test.tsx`: Nivel, Cupón activo y Pedidos,
  cada valor `-`, con las notas. Sin correo, teléfono ni fecha de alta en
  la página. Sin `Club 5%`, `VIP15` ni `07`. El kicker sigue con el año de
  `created_at`. Inglés: Tier, Active coupon, Orders.
  La grilla lleva borde `border-hairline`. La etiqueta de la ficha, tracking
  0.16em. `AccountCard` se reutiliza.
  Archivos: `account-view.tsx`, `account-view.test.tsx`.

## US-2 · Pedidos vacíos

- [x] **T290 · Empty state** → US-2, RF-2, AC-3
  Depende de T287 y T289.
  Mismo test: `h2` «Tus pedidos» / «Your orders» y el párrafo vacío. Sin
  `SP-`. Sólo con sesión usable.
  Archivos: `account-view.tsx`, `account-view.test.tsx`.

## US-3 · Cabecera

- [x] **T291 · Botones del prototipo** → US-3, RF-3, AC-4, AC-5
  Depende de T289.
  Gap 20px entre título y botones, 10px entre kicker y `h1`, 10px entre
  botones. Los tres dejan `ButtonPrimary`: 11px, tracking 0.16em,
  padding 13×22, sin `min-h`. Editar abre el drawer (el correo vuelve a
  verse ahí). Salir llama la action. Eliminar abre el diálogo. Cuenta
  bloqueada o no disponible: sin fichas, sin pedidos, sin editar ni
  eliminar.
  Archivos: `account-view.tsx`, `account-view.test.tsx`.

## Polish

- [x] **T292 · Verify y handoff** → RNF-1, RNF-4
  Depende de T288–T291. Gate de `web` en `.cursor/verify.json` (`--no-deps`).
  No se suma E2E: sin sesión no se ve la cuenta y no se añade `api` al
  servicio `e2e`. Tildar esta lista. `progress.md` con el estado y el
  paso siguiente.

## Dependencias

```
T287 ─→ T289 ─→ T290
         └────→ T291
T288 [P] ─────────────→ T292
```

T288 no espera al diccionario. T290 y T291 editan el mismo componente;
van en ese orden. T292 cierra.

## Definition of Done

- T287–T292 tildadas.
- AC-1…AC-7 cubiertos por Vitest. Sin API viva.
- `/verify` de `web` en verde. `verify.json` sin cambios. `api/` sin cambios.
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
