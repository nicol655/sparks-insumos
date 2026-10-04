# Tasks · 011 Cascarón del backoffice

- **Estado:** cerrada (T311–T318)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0016](../../decisions/0016-cascaron-backoffice-texto-estatico.md)

No se toca `web/` ni `api/`. No hay dependencia nueva ni `fetch` nuevo.
El texto sale de constantes. Cada tarea de comportamiento se escribe en
rojo y después el mínimo de código que la pone verde.

## Setup

- [x] **T311 · URL de la tienda** → RF-2, AC-2
  Depende de 010 (el servicio ya existe). Test primero, en
  `backoffice/src/lib/__tests__/env.test.ts`: si
  `NEXT_PUBLIC_STORE_URL` falta o viene vacía, `storeUrl` es
  `http://localhost:3000`; una barra final se recorta; una URL sin
  esquema tira. `API_BASE_URL` sigue como está.
  Documentar la variable en `backoffice/.env.example` y pasarla en
  `backoffice/docker-compose.yml` con ese default.
  Archivos: `src/lib/env.ts`, el test, `.env.example`, `docker-compose.yml`.

## Foundational

- [x] **T312 · Texto fijo** `[P]` → RF-1, RF-3, RF-4, RF-5, RNF-2, ADR-0016
  Puede ir en paralelo con T311.
  Test primero: `backoffice/src/content/__tests__/panel.test.ts`.
  Afirma los ocho ítems y los conteos 2, 5, 3, 10 y 3; las cuatro
  fichas, el total `$2.758.000`, catorce barras (la primera
  `15/9 · $144.000`, la última `28/9 · $214.000`), las seis filas de
  pedidos, las cinco de stock y las tres consultas; los cinco grupos
  de ajustes, el email, el CBU de la maqueta y «Hasta 3»; los seis
  títulos de sección.
  Comentario de una línea en `resumen.ts` y `ajustes.ts`: es copy de
  la maqueta, no un dato de la API.
  Archivos: `src/content/nav.ts`, `resumen.ts`, `ajustes.ts`,
  `sections.ts`, el test.

- [x] **T313 · Guarda de las rutas nuevas** `[P]` → RF de rutas, AC-4
  Puede ir en paralelo con T311 y T312. La función ya deja pasar
  cualquier ruta privada con sesión y manda el resto a
  `/unauthorized`. Sumar en
  `backoffice/src/lib/auth/__tests__/guard.test.ts` que, sin sesión,
  `/ajustes` va a `/unauthorized`, y que con sesión `/ajustes` y
  `/pedidos` no redirigen. `/pedidos` anónimo ya está cubierto.
  No se edita `guard.ts` salvo que el test falle.
  Archivo: el test.

## US-1 · Cascarón

- [x] **T314 · Menú y encabezado** → US-1, RF-1, RF-2, AC-1, AC-2, AC-10
  Depende de T311 y T312. Test primero:
  `backoffice/src/components/shell/__tests__/shell.test.tsx`.
  Monta `Shell` con `storeUrl="http://localhost:3000"` y pathname
  `/dashboard`. Exige los tres grupos, los ocho enlaces, los conteos,
  «Sparks», «Backoffice», «Martina Álvarez», «Administradora»,
  `aria-current="page"` en Resumen, la miga «Backoffice / Resumen»,
  el placeholder «Buscar pedidos, productos o clientes», el enlace
  «Ver tienda» con ese href, y que no estén
  `Sparks Perfumes.dc.html` ni «Sin coincidencias». El botón «Menú»
  tiene `aria-label="Menú"` y la clase `lg:hidden`.
  Un segundo caso, con pathname `/ajustes`, exige la miga
  «Backoffice / Ajustes».
  Sidebar oscuro de 248px. Por debajo de `lg` arranca cerrado
  (`-translate-x-full`) y el botón lo abre; al seguir un ítem se
  cierra. Sin atajo ⌘K y sin lista de resultados.
  Archivos: `src/components/shell/shell.tsx`, `sidebar.tsx`,
  `header.tsx`, el test.

- [x] **T315 · Rutas del panel** → US-1, RF-5, AC-3, AC-9
  Depende de T314. Route group `(panel)`: el layout monta `Shell`
  con `env.storeUrl`. `/login` y `/unauthorized` quedan afuera.
  Mover `app/dashboard/page.tsx` a `(panel)/dashboard` (el contenido
  lo pone T316; mientras tanto puede renderizar el resumen si T316
  ya está). Crear `(panel)/ajustes` y las seis rutas de título.
  Test primero:
  `backoffice/src/components/shell/__tests__/section-title.test.tsx`
  parametrizado con los seis `h1`.
  `backoffice/src/app/(panel)/pedidos/__tests__/page.test.tsx`:
  `h1` «Pedidos», sin «Exportar CSV» y sin `SP-10482`.
  En los tests de login y de `/unauthorized`, afirmar que no aparece
  «Martina Álvarez».
  Borrar `app/dashboard/page.tsx` y su test viejo del `main` vacío.
  Archivos: `app/(panel)/layout.tsx`, las páginas, `section-title.tsx`,
  los tests, y el borrado del dashboard anterior.

## US-2 · Resumen

- [x] **T316 · Resumen** → US-2, RF-3, AC-5, AC-6
  Depende de T312. Puede ir en paralelo con T314 y T317.
  Test primero:
  `backoffice/src/components/resumen/__tests__/resumen-view.test.tsx`
  y reemplazo de
  `app/(panel)/dashboard/__tests__/page.test.tsx` (las cuatro fichas,
  ya no el `main` vacío).
  Antetítulo, «Buen día, Martina.», las cuatro fichas, «Ventas ·
  últimos 14 días», `$2.758.000`, 14D con `aria-pressed`, catorce
  barras, eje `15/9` `19/9` `24/9` `28/9`, seis pedidos, cinco de
  stock, tres consultas, «Ver todos» → `/pedidos`, «Bandeja» →
  `/mensajes`. Una fila `SP-` no es un enlace. Pulsar 7D no cambia
  el total ni llama a `fetch`. 7D y 30D no tienen handler.
  `(panel)/dashboard/page.tsx` renderiza `ResumenView`.
  Archivos: `page-heading.tsx`, `resumen-view.tsx`, la página, los tests.

## US-3 · Ajustes

- [x] **T317 · Ajustes** `[P]` → US-3, RF-4, AC-7, AC-8
  Puede ir en paralelo con T316, después de T312.
  Test primero:
  `backoffice/src/components/ajustes/__tests__/ajustes-view.test.tsx`.
  Los cinco grupos, cada etiqueta y cada valor de RF-4 (email, CBU,
  «Hasta 3», «Habilitada», «Publicado», «Peso argentino (ARS)»).
  Inputs de texto con `readOnly`. Pulsar «Guardar ajustes» no llama
  a `fetch` y el email sigue. Selects con una sola opción. Los
  interruptores no tienen handler.
  `(panel)/ajustes/page.tsx` renderiza `AjustesView`.
  Archivos: `ajustes-view.tsx`, la página, el test.

## Polish

- [x] **T318 · Verify y handoff** → RNF-3, RNF-4
  Depende de T313–T317. `docker compose -f docker/docker-compose.yml run --rm --no-deps backoffice npm run verify`.
  Arreglar la causa. Tildar esta lista. `architecture.md` y
  `project.md` dejan de decir que el panel está vacío.
  `progress.md`: estado y el paso siguiente (secciones sin contenido,
  roles y cambio de clave siguen fuera). `web/` y `api/` sin cambios.

## Dependencias

```
010 → T311 ──────────────→ T314 → T315 (US-1, AC-3, AC-9)
    → T312 [P] ──────────→ T314
              ├──────────→ T316 (US-2)
              └──────────→ T317 [P] (US-3)
    → T313 [P]
T313–T317 → T318
```

T311, T312 y T313 pueden ir en paralelo. T316 y T317 también, una
vez escrito el texto. T315 espera el cascarón. T314 puede esperar
el resumen: la página de dashboard la cierra T316.

## Definition of Done

- T311–T318 tildadas.
- AC-1…AC-10 cubiertos por Vitest, sin API viva y sin `fetch` de datos.
- `/verify` del backoffice verde (`typecheck`, `lint`, `test`, `build`,
  `--no-deps`).
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- `web/` y `api/` sin cambios. Roles, logout, cambio de clave y el
  contenido de pedidos, catálogo, mensajes, usuarios, cupones y
  contenido del sitio, sin implementar.
