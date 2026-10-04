# Plan técnico · 011 Cascarón del backoffice

- **Estado:** propuesto (2026-09-28)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0016](../../decisions/0016-cascaron-backoffice-texto-estatico.md)
  (texto fijo, sin servicio de mentira; el enlace a la tienda es el
  storefront del stack). Reusa [0014](../../decisions/0014-sesion-backoffice-session-storage.md)
  (la guarda sigue en el cliente), [0004](../../decisions/0004-docker-first.md),
  [0005](../../decisions/0005-estrategia-de-testing.md) (Vitest, sin
  Playwright) y [0006](../../decisions/0006-fuentes-versionadas.md).
  No reabre 0012.

## 1 · Enfoque

Un route group `(panel)` envuelve las secciones. Su layout es el
cascarón: menú, encabezado y `{children}`. `/login` y `/unauthorized`
quedan fuera del group, así que no heredan el menú (AC-3).

`/dashboard` deja de ser un `main` vacío y renderiza el resumen. Eso
reemplaza RF-7 y AC-9 de 010. La guarda no se reescribe: una ruta nueva
con sesión ya cae en el `return null` de `decideRedirect`.

Los números y los nombres salen de dos módulos de constantes. Los
componentes los imprimen. No hay `fetch`, no hay Zustand nuevo y no hay
función que sume la serie de la maqueta (ADR-0016, RF de 011, RNF-2).

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `backoffice/src/content/nav.ts` | Grupos, ítems, hrefs y conteos de RF-1 |
| `backoffice/src/content/resumen.ts` | Fichas, barras, pedidos, stock y consultas de RF-3 |
| `backoffice/src/content/ajustes.ts` | Grupos, etiquetas y valores de RF-4 |
| `backoffice/src/content/sections.ts` | Título de las seis rutas que sólo tienen `h1` |
| `backoffice/src/lib/env.ts` | `NEXT_PUBLIC_STORE_URL`, default `http://localhost:3000` |
| `backoffice/.env.example` | La misma variable, comentada como URL que abre el navegador |
| `backoffice/src/components/shell/sidebar.tsx` | Menú y pie |
| `backoffice/src/components/shell/header.tsx` | Migas, búsqueda, enlace |
| `backoffice/src/components/shell/shell.tsx` | Grilla, menú angosto |
| `backoffice/src/components/shell/page-heading.tsx` | Antetítulo, `h1`, acción |
| `backoffice/src/components/resumen/resumen-view.tsx` | RF-3 |
| `backoffice/src/components/ajustes/ajustes-view.tsx` | RF-4 |
| `backoffice/src/components/shell/section-title.tsx` | El `h1` pelado de RF-5 |
| `backoffice/src/app/(panel)/layout.tsx` | `Shell` alrededor de `children` |
| `backoffice/src/app/(panel)/dashboard/page.tsx` | Mueve la página actual y renderiza `ResumenView` |
| `backoffice/src/app/(panel)/ajustes/page.tsx` | `AjustesView` |
| `backoffice/src/app/(panel)/{pedidos,catalogo,mensajes,usuarios,cupones,contenido}/page.tsx` | `SectionTitle` |
| `backoffice/src/lib/auth/__tests__/guard.test.ts` | Casos de AC-4 para `/ajustes` y `/pedidos` |
| `backoffice/src/app/dashboard/__tests__/page.test.tsx` | Deja de exigir el `main` vacío; pasa a las fichas de AC-5. El archivo se mueve junto a la ruta nueva |
| Tests colocados de shell, resumen y ajustes | AC-1, AC-2, AC-3, AC-6, AC-7, AC-8, AC-9, AC-10 |

`web/` y `api/` no se tocan. `.cursor/verify.json` tampoco: los checks
`backoffice-*` ya corren la suite.

Login, sesión, `AuthGate` y las pantallas públicas quedan como en 010.

## 3 · Cascarón

Tokens que ya están en `backoffice/src/styles/theme.css`. Sidebar de
248px, fondo `ink`, texto `canvas`, ítem activo invertido (`canvas` /
`ink`). Header de 68px, sticky, fondo canvas al 92%. `main` con el
padding del diseño y `max-w-[1760px]`.

```
body
  AuthGate
    (panel)/layout
      div  min-h-screen  lg:grid-cols-[248px_minmax(0,1fr)]
        Sidebar
          Sparks / Backoffice
          nav por grupos
          pie MA · Martina Álvarez · Administradora
        columna
          Header
            botón Menú (sólo < lg) + migas
            input búsqueda
            a  Ver tienda ↗
          main
            children
```

Por debajo de `lg` (900px, el corte del diseño) el sidebar es `fixed`,
fuera de pantalla hasta que el botón «Menú» lo abre. Un fondo
`ink/45` cierra al pulsar. El estado abierto es `useState` local del
`Shell`, no un store. Al seguir un ítem se cierra.

El ítem activo sale de `usePathname()`. `/dashboard` activa Resumen.

Migas: `Backoffice / ` + título. En resumen el título visible es
«Buen día, Martina.» y la miga dice «Resumen», como la maqueta
(`title.replace`).

El enlace lee `storeUrl` de `parseEnv`. Default
`http://localhost:3000`. Sin `target`. Dos spans intercambian «Ver
tienda» y «Tienda» con `min-[640px]`; el `↗` va en los dos. El nombre
accesible contiene «tienda».

El input de búsqueda no tiene `onChange` que filtre. No se renderiza
el popover.

El atajo ⌘K no se implementa (fuera de spec).

## 4 · Resumen

`ResumenView` es un server component. Importa `resumen.ts` y pinta:

- `PageHeading` sin acciones.
- Grilla de cuatro fichas. El delta de ventas y el de pedidos van en
  `text-success` y `text-accent-gold` según el diseño; el de socios, en
  `text-text-meta`. El «▲ 3,9%» es la cadena fija de la maqueta, no un
  cálculo.
- Catorce `div` de barra. Alturas y `title` (`15/9 · $144.000` …
  `28/9 · $214.000`) son constantes copiadas una vez. La última barra
  usa `bg-accent-gold`; el resto, `bg-ink`.
- Tres botones 7D / 14D / 30D. 14D lleva `aria-pressed="true"`. 7D y
  30D son `type="button"` sin handler. El test pulsa 7D y sigue viendo
  `$2.758.000` (AC-6).
- Pedidos como filas, no como botones. «Ver todos» es `<a href="/pedidos">`.
- Stock y consultas igual. «Bandeja» es `<a href="/mensajes">`.

No se formatea con `toLocaleString` en runtime: las cadenas ya vienen
escritas, así el test no depende del ICU del contenedor.

## 5 · Ajustes

`AjustesView` pinta los cinco grupos. Cada campo es la etiqueta mono
del diseño y el valor en un control visual, para que la pantalla se
lea como el diseño:

- texto y número: `input` con `defaultValue` y `readOnly`
- tarjeta, transferencia, efectivo, español e inglés: el interruptor
  se ve prendido y el texto es «Habilitada», «Habilitada»,
  «Habilitado», «Publicado», «Publicado». El botón no tiene handler
- cuotas, idioma y moneda: un `select` con una sola `option` visible
  («Hasta 3», «Español», «Peso argentino (ARS)»)

«Guardar ajustes» es `type="button"`. El test espía `global.fetch` y
espera que no se lo llame (AC-8).

El CBU queda en ese `input`. Ningún otro paquete lo importa.

## 6 · Otras secciones

Cada `page.tsx` renderiza `SectionTitle` con el título de
`sections.ts`. Un test de `/pedidos` afirma el `h1` y la ausencia de
«Exportar CSV» y de `SP-10482` (AC-9). No hace falta repetir la tabla
entera en las otras cinco: el mismo componente recibe el título, y un
test parametrizado cubre los seis `h1`.

## 7 · Entorno

`parseEnv` acepta `NEXT_PUBLIC_STORE_URL` opcional. Vacío o ausente
cae en `http://localhost:3000`. Una URL inválida tira, igual que hoy
un `API_BASE_URL` vacío. El test de env cubre el default.

Esa variable es pública porque el `<a>` se resuelve en el navegador.
No es un secreto. No se usa `API_BASE_URL` para esto: esa apunta a
`http://api:8000`, que el navegador no abre.

## 8 · Trade-offs

- **Controles mudos en vez de un rango que recalcula.** El pedido
  pidió texto, no un mock. 7D y 30D no tienen handler: 14D sigue
  marcado y las cifras no se mueven. Es lo que AC-6 exige.
- **Inputs `readOnly` en ajustes.** Se leen como el formulario del
  diseño y no se pueden tomar por un guardado real. Un `<p>` con el
  valor también cumpliría el texto, pero no la composición.
- **Seis rutas casi vacías.** El menú tiene que navegar. Llenarlas
  sería la tarea que este pedido dejó afuera.
- **«Martina Álvarez» en el pie.** Es copy hasta que exista la spec
  de sesión visible. No se llama a `GET /me` (con
  `must_change_password` ese GET es 403).

## 9 · Riesgos

- Quien lea el panel puede tomar las cifras y el CBU por reales. La
  spec lo acota al panel y ADR-0015 sigue vigente. El comentario de
  cabecera de `resumen.ts` y `ajustes.ts` lo repite en una línea.
- 010 documenta el dashboard vacío. Esta spec lo dice en el padre y
  el test viejo se reemplaza; si alguien reimplementa AC-9 de 010,
  choca con AC-5.
- El default `localhost:3000` falla si `WEB_PORT` no es 3000. Se
  cambia la env, no el código.

## 10 · Tests

Vitest + Testing Library, en el contenedor, `--no-deps`. Sin axe nuevo
salvo el que ya corre si un test de shell lo pide: el botón «Menú»
lleva `aria-label="Menú"` y el enlace a la tienda tiene nombre.

| AC | Dónde |
|----|--------|
| AC-1 | `shell.test.tsx` monta `Shell` con pathname `/dashboard` |
| AC-2 | El mismo, más `env.test.ts` para el default del href |
| AC-3 | `login-screen.test.tsx` y `unauthorized/page.test.tsx` siguen sin «Martina Álvarez»; se agrega la aserción |
| AC-4 | `guard.test.ts`, dos rutas nuevas |
| AC-5, AC-6 | `resumen-view.test.tsx` |
| AC-7, AC-8 | `ajustes-view.test.tsx`, con `vi.spyOn(globalThis, "fetch")` |
| AC-9 | `section-title.test.tsx` parametrizado y la página de pedidos |
| AC-10 | `shell.test.tsx`: el botón está en el DOM y lleva `lg:hidden` (clase), no un media query simulado |

No se agrega Playwright.

## 11 · Constitución

| Principio | Cómo se cumple |
|-----------|----------------|
| 8, 9, 10 | Los montos de ajustes son las constantes ya escritas en el modelo. Esta pantalla no calcula un carrito |
| 11 | El CBU sólo se imprime en el campo de ajustes. El enlace a la tienda no lleva a un pago |
| 14 | No se aplica la matriz. La spec lo deja fuera a propósito |
| 17 | Copy de la maqueta, sin siembra y sin `web/` |
| 1–7 | Spec antes que código, diff acotado a `backoffice/`, sin dependencia nueva |
