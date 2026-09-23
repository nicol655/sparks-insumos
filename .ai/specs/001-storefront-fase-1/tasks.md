# Tareas · 001 Storefront Sparks Parfums — Fase 1

- **Estado:** listo para `/implement`
- **Fecha:** 2026-09-22
- **Origen:** [`spec.md`](./spec.md) (aprobada) · [`plan.md`](./plan.md) (aprobado)

Convenciones de este checklist:

- `[P]` = puede ejecutarse en paralelo con las demás tareas `[P]` de su bloque (no comparten archivo).
- **Prueba:** indica el test que acompaña a la tarea. Cuando dice *test-first*, el test se escribe
  y se ve fallar **antes** de la implementación.
- `→ AC-n` / `→ US-n` traza la tarea a su criterio de aceptación o historia en `spec.md`.
- Todos los comandos se ejecutan dentro de Docker. Ninguna tarea requiere Node en el host.

---

## Fase 0 · Setup del entorno

Objetivo: un clon limpio arranca, compila y verifica con sólo Docker instalado.

- [x] **T001 · Andamiaje del servicio `web/`**
  Generar Next.js (App Router, TypeScript, Tailwind v4) **desde un contenedor efímero**, no desde
  el host, con `--skip-install` para que `node_modules` nunca aterrice en la máquina.
  Activar en `web/tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`.
  Archivos: `web/package.json`, `web/tsconfig.json`, `web/next.config.ts`.
  *Prueba: `npm run typecheck` pasa.*
  **Hecho:** Next **16.3.5**, no 15 — era la estable y todo el stack la soporta (ver ADR-0001).
  `typecheck` es `next typegen && tsc --noEmit`: Next 16 genera tipos de ruta (`LayoutProps`) que
  `tsc` necesita. `@types/node` subió a `^22` para coincidir con el runtime y con Vitest 5.

- [x] **T002 · Dockerfile multi-etapa**
  Etapas `deps` → `dev` → `builder` → `runner` según `plan.md` §7. `output: 'standalone'` en
  `next.config.ts`; `runner` con usuario no root. La etapa `e2e` llega en T006.
  Archivos: `web/Dockerfile`, `web/next.config.ts`.
  *Prueba: `docker build --target runner` completa y el contenedor sirve la home.*

- [x] **T003 · Orquestación y configuración de entorno**
  `web/docker-compose.yml` (servicio solo) y `docker/docker-compose.yml` (stack completo, referencia
  el Dockerfile de `web/`, **nunca lo duplica**). Volumen anónimo en `node_modules`,
  `WATCHPACK_POLLING=true`. `.env.example` con `API_MODE`, `API_BASE_URL`,
  `NEXT_PUBLIC_WHATSAPP_NUMBER=5491168692694`. `.dockerignore` con `node_modules`, `.next`, `.git`,
  `test-results`, `playwright-report`.
  Archivos: `web/docker-compose.yml`, `docker/docker-compose.yml`, `web/.dockerignore`, `web/.env.example`, `.gitignore`.
  *Prueba: `docker compose -f docker/docker-compose.yml up web` levanta con hot reload verificado editando un archivo.*
  **Hecho:** el puerto del host es `${WEB_PORT:-3000}` porque 3000 suele estar ocupado por otros
  proyectos; override en `docker/.env` (plantilla en `docker/.env.example`). El healthcheck apunta
  a `127.0.0.1`, no a `localhost` — ver `.ai/lessons.md`.

- [x] **T004 [P] · Lint y formato**
  ESLint 9 flat config + `eslint-config-next` + Prettier + `prettier-plugin-tailwindcss`.
  Archivos: `web/eslint.config.mjs`, `web/.prettierrc`.
  *Prueba: `npm run lint` pasa en el andamiaje.*

- [x] **T005 [P] · Vitest + Testing Library**
  Config con entorno `jsdom`, alias `@/`, `setupFiles` y helper de accesibilidad.
  Archivos: `web/vitest.config.mts`, `web/vitest.setup.ts`, `web/src/test/a11y.ts`.
  *Prueba: un test smoke corre y pasa dentro del contenedor.*
  **Hecho:** `vitest-axe` reemplazado por `axe-core` directo (ADR-0005). Config en `.mts` para que
  Vite la cargue como ESM, y `resolve.tsconfigPaths` nativo en lugar de `vite-tsconfig-paths`.

- [x] **T006 · Playwright y etapa `e2e`**
  `playwright.config.ts` con proyectos a 360 / 900 / 1140 / 1440px y `@axe-core/playwright`.
  Añadir la etapa `e2e` al Dockerfile con base `mcr.microsoft.com/playwright` **fijada a la misma
  versión** que la dependencia de `package.json`, y su servicio en compose.
  Archivos: `web/playwright.config.ts`, `web/Dockerfile`, `docker/docker-compose.yml`.
  *Prueba: un E2E smoke contra la home pasa en el servicio `e2e`.*
  Depende de T002, T003.

- [x] **T007 · Gate de verificación** → AC-19
  Script `npm run verify` (typecheck + lint + test + build) y los cuatro checks de
  `.cursor/verify.json` habilitados con `docker compose -f docker/docker-compose.yml run --rm web …`.
  Archivos: `web/package.json`, `.cursor/verify.json`.
  *Prueba: `/verify` pasa en verde desde un árbol limpio, sin Node en el host.*
  Depende de T001–T005.

---

## Fase 1 · Cimientos

Objetivo: tokens, datos, estado e i18n en su sitio antes de que exista una sola pantalla.

### 1a · Sistema de diseño

- [x] **T010 · Test de tokens de color** *(test-first)* → AC-1
  Parsear `src/styles/theme.css` y comparar contra la tabla del §01 del PDF: los 9 tokens con su
  hex exacto y **ningún color adicional**.
  Archivo: `web/src/styles/__tests__/tokens.color.test.ts`.

- [x] **T011 · Paleta en `@theme`**
  Implementa hasta que T010 pase. Primarios, secundarios, superficies, neutros de texto/borde y
  semánticos del §01.
  Archivo: `web/src/styles/theme.css`.

- [x] **T012 · Test de escala tipográfica y layout** *(test-first)* → AC-2, AC-3
  Los 12 niveles del §02 con su `clamp`, `line-height` y `tracking`; los seis breakpoints
  (560/700/900/1140/1440/2160); la escala de espaciado de 4px; radio 0 salvo `--radius-chip`.
  Archivo: `web/src/styles/__tests__/tokens.scale.test.ts`.

- [x] **T013 · Tipografía, breakpoints, espaciado y radios en `@theme`**
  Implementa hasta que T012 pase. **Reemplazar** los breakpoints por defecto de Tailwind, no
  ampliarlos. `--radius-*: initial` para que `rounded-lg` deje de existir.
  Archivos: `web/src/styles/theme.css`, `web/src/app/globals.css`.

- [x] **T014 · Fuentes autoalojadas y presupuesto** → RNF-7
  Cormorant Garamond (300/400/500/600 + itálica 400), Jost (200/300/400/500) e IBM Plex Mono
  (400/500) vía `next/font/google`, subsets `latin` + `latin-ext`, `display: 'swap'`.
  **Medir el peso total servido y anotarlo en la tarea.** Si supera 180KB, recortar pesos y
  registrar la desviación en `.ai/lessons.md`.
  Archivos: `web/src/app/[locale]/layout.tsx`, `web/src/styles/fonts.ts`.
  **Hecho: 136KB**, 10 caras, subset latino, dentro del presupuesto. Medido con
  `npm run font-budget`.
  Dos desvíos, ambos medidos y registrados en **ADR-0006**: los `.woff2` están **versionados** y
  se usa `next/font/local` en vez de `next/font/google`, porque descargar en cada build hacía
  fallar el gate al azar; y se envía **sólo el subset latino**, porque añadir `latin-ext` sube a
  204KB (por encima de los 180KB) y ni es-AR ni en usan un solo codepoint suyo.
  Cormorant quedó en pesos 400 y 500: el §02 lista 300–600 pero la escala sólo usa 400, el
  wordmark 500 y la itálica 400.

- [x] **T015 [P] · Animaciones y reduced motion** → RNF-3
  `fadeUp`, `slideIn`, marquesina 34s lineal. Duraciones del §06. Bloque
  `@media (prefers-reduced-motion: reduce)` que detiene la marquesina y baja todo a un fundido de
  120ms. Hover envuelto en `@media (hover: hover)`.
  Archivo: `web/src/styles/animations.css`.

- [x] **T016 [P] · Export JSON de tokens** → §05 del PDF
  Script `npm run tokens:json` que genera `src/design-tokens.json` desde `theme.css`.
  Archivos: `web/scripts/tokens-to-json.mjs`, `web/src/design-tokens.json`.
  *Prueba: test que regenera y falla si el JSON versionado está desactualizado.*

### 1b · Datos y estado

- [x] **T017 [P] · Validación de entorno**
  Esquema Zod para `API_MODE`, `API_BASE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Falla al arrancar si
  falta algo.
  Archivo: `web/src/lib/env.ts`.
  *Prueba: unitaria de entorno válido e inválido.*
  `NEXT_PUBLIC_WHATSAPP_NUMBER` tiene el número del §06 como valor por defecto: es información
  pública impresa en el sitio y sin él `next build` fallaría en el contenedor `builder`, que no
  recibe variables. Un override malformado sí se rechaza.

- [x] **T018 · Contrato de API en Zod** → RF-10
  Esquemas de `Product`, `Facets`, `SearchResult` y los parámetros de filtro/orden, según
  `plan.md` §5. Los tipos se **infieren** de los esquemas.
  Archivo: `web/src/lib/api/contract.ts`.
  Familia y concentración viajan como *slug*, no como texto visible: la etiqueta se traduce en el
  diccionario (`families.<slug>`). Marca y nombre nunca se traducen.
  **Provisional:** el enum `productSortSchema` (`relevance`, `price-asc`, `price-desc`,
  `name-asc`) no salió del prototipo — los clics dentro del iframe del artifact no registran.
  Confirmar contra el prototipo antes de T063.

- [x] **T019 · Fixtures del catálogo**
  Datos de muestra extraídos del prototipo, validados contra `contract.ts` en tiempo de test.
  Archivo: `web/src/fixtures/catalog.ts`.
  12 productos de relleno con las 8 marcas de la marquesina y las 4 familias del prototipo. Los
  nombres, precios, notas y stock **no son reales** (pregunta abierta 1). Todos con
  `packshot: null` para ejercitar el placeholder del §05 (pregunta abierta 2).

- [x] **T020 · Repositorio y adaptadores**
  Interfaz `CatalogRepository` (`listProducts`, `getProduct`, `getRelated`, `getFacets`, `search`),
  `mock-repository`, `http-repository` (valida respuestas con Zod) y selector por `API_MODE`.
  Archivos: `web/src/lib/api/{repository,mock-repository,http-repository,index}.ts`.
  El repositorio recibe el `locale` y devuelve la copia ya traducida, igual que hará `api/` con
  `Accept-Language`.

- [x] **T021 · Contract tests sobre ambos adaptadores** → RF-10
  Una única suite parametrizada que corre contra mock y HTTP (este último con `fetch` stubbeado):
  filtrado combinado, orden, paginación, producto inexistente, respuesta malformada.
  Archivo: `web/src/lib/api/__tests__/contract.test.ts`.
  47 aserciones. El backend falso del test **es** la descripción ejecutable de lo que `api/` debe
  cumplir. Sin paginación: la Fase 1 devuelve el catálogo completo con su `total`.

- [x] **T022 [P] · Formato de moneda** *(test-first)* → AC-4
  `formatPrice(39000) === '$39.000'`. Usar `Intl.NumberFormat('es-AR')` con `formatToParts` y
  ensamblado explícito: el locale inserta un espacio duro tras el `$` que rompería el criterio.
  Archivos: `web/src/lib/format/price.ts` + `__tests__/price.test.ts`.

- [x] **T023 [P] · Enlaces de WhatsApp** *(test-first)* → AC-18, US-8
  `buildWhatsappUrl(context)` para consulta general, stock y producto específico. `wa.me/5491168692694`,
  texto con `encodeURIComponent`.
  Archivos: `web/src/lib/whatsapp.ts` + `__tests__/whatsapp.test.ts`.
  El módulo sólo arma el enlace; el mensaje sale del diccionario (`whatsapp.*`) para que se
  traduzca, en vez de construirse en código.

- [x] **T024 · Store de carrito** *(test-first)* → US-5, AC-6
  Zustand + `persist`. Agregar, cambiar cantidad (mínimo 1), quitar, totales, cupón.
  Validar con Zod lo hidratado de `localStorage` y **recalcular precios desde el repositorio**,
  nunca leerlos del almacenamiento.
  Archivos: `web/src/lib/cart/store.ts` + `__tests__/store.test.ts`.
  Depende de T020.
  Se persisten sólo `{productId, slug, quantity}`; `resolveCart()` los une con el producto vivo y
  reporta aparte lo agotado o descatalogado. Nada dependiente del idioma llega al disco.
  **Cupón pendiente:** nadie definió qué códigos existen ni qué hacen. La barra de anuncio habla
  de descuentos por volumen (5%/10% por monto), que no son códigos. Ver pregunta abierta 4.

- [x] **T025 [P] · Store de UI**
  Drawer de carrito, overlay de búsqueda, menú móvil y cola de toasts.
  Archivo: `web/src/lib/ui/store.ts`.
  Un único campo `overlay` en vez de un booleano por panel: el diseño nunca muestra dos a la vez,
  y así el bloqueo de scroll y el manejo de Escape no pueden entrar en conflicto. La cola de
  toasts llega con T031, que es donde se usa.

### 1c · i18n

- [x] **T026 · Infraestructura de `next-intl`** → RF-7, US-6
  `routing.ts` (locales `es`/`en`, por defecto `es`, prefijo de ruta), `request.ts`, middleware,
  layout `[locale]` y diccionarios base.
  Archivos: `web/src/i18n/{routing,request}.ts`, `web/src/proxy.ts`,
  `web/src/i18n/messages/{es,en}.json`, `web/src/app/[locale]/layout.tsx`.
  `localePrefix: "always"` — una URL canónica por idioma. Los nombres de ruta también se traducen
  (`/es/catalogo` ↔ `/en/catalogue`). El middleware se llama `proxy.ts`: Next 16 deprecó el
  convenio anterior. El layout raíz vive dentro de `[locale]`, así que hace falta
  `[locale]/[...rest]` para que un 404 tenga dónde renderizarse.
  Verificado: `/` → 307 a `/es`, `/es` y `/en` 200, `/es/no-existe` 404.

- [x] **T027 · Regla de lint contra texto literal** → AC-8
  `eslint-plugin-i18next` con `no-literal-string` sobre `src/components/**`, como **error**.
  Archivo: `web/eslint.config.mjs`.
  Depende de T004, T026.
  Modo `jsx-only` con lista blanca de atributos (`alt`, `aria-label`, `placeholder`, `title`,
  `label`): `jsx-text-only` no mira atributos y dejaba pasar un `alt` hard-codeado, que es lo que
  AC-20 vigila. Comprobado con un componente sonda: texto JSX, `alt` y `aria-label` dan error;
  `className`, `id` y `data-testid` no.

### 1d · Primitivas del §03

Cada tarea cubre los cinco estados (default, hover, active, focus-visible, disabled) más los
propios del componente. Todas llevan test de componente con Testing Library + `vitest-axe`.
Las cuatro son paralelizables entre sí.

- [x] **T028 [P] · Botones** — primario, secundario (outline, con variante sobre fondo ink) y
  terciario (inversión completa al hover). Incluye estado `loading` con `aria-busy` y ancho
  conservado, y altura mínima 48px móvil / 44px absoluto.
  Archivos: `web/src/components/primitives/button-{primary,secondary,tertiary}.tsx` + tests.
  Tipografía, foco y estado `loading` compartidos en `button-base.tsx`; los tres componentes son
  archivos separados porque difieren en color y padding, no en comportamiento.
  El terciario **no** lleva el área táctil de 48/44px: el §03 le fija padding 8px 13px, que queda
  por debajo. Vive dentro de una tarjeta cuya imagen y nombre son los objetivos primarios, así que
  es un atajo y no la única entrada.
  Los valores en píxeles (padding, altura táctil, color de hover) son CSS y se verifican con un
  motor real en la fase de Playwright; estos tests cubren comportamiento y semántica.

- [x] **T029 [P] · Campos de formulario** — input de línea (etiqueta mono encima, subrayado 1px,
  `font-size: 16px` en móvil para evitar el zoom de iOS, estado error con `aria-invalid` +
  `aria-describedby`), input en caja, select con línea inferior y stepper de cantidad
  (44×44 móvil / 38 escritorio, `aria-live="polite"`, `−` deshabilitado en 1).
  Archivos: `web/src/components/primitives/{text-input,boxed-input,select,quantity-stepper}.tsx` + tests.
  El `Select` usa un `<select>` nativo a propósito: regala la lista, el teclado y el selector móvil
  de la plataforma. El coste es que el chevron **no rota al abrir** —el navegador no expone ese
  estado— y el §05 lo pide. Un listbox propio era la única alternativa y no compensa la superficie
  de accesibilidad que añade.

- [x] **T030 [P] · Chip, badge y skeleton** — chip de filtro (único radio 999px del sistema, toggle
  con `aria-pressed`, variante removible con `aria-label "Quitar filtro: <valor>"`), badge de
  tarjeta y skeleton con el patrón diagonal 135° `#EDE7DC`/`#F2EDE4` **sin animación de brillo**.
  Archivos: `web/src/components/primitives/{filter-chip,badge,skeleton}.tsx` + tests.

- [x] **T031 [P] · Acordeón y toast** — acordeón multi-panel (`<button>` con `aria-expanded` y
  `aria-controls`, panel `role="region"` + `aria-labelledby`, signo `+`/`−`) y toast
  (`role="status"`, `aria-live="polite"`, autocierre a 2200ms).
  Archivos: `web/src/components/primitives/{accordion,toast}.tsx` + tests.
  El toast son dos elementos anidados: los keyframes de `fade-up` animan `transform` y anulaban el
  `-translate-x-1/2` que lo centra. El externo posiciona, el interno se mueve.

- [x] **T031b · Iconos SVG del §05** *(no estaba en el plan)*
  `eslint-plugin-i18next` marcó el glifo `✕` del chip como texto literal, y con razón: el §05 pide
  SVG de trazo para `x`, `chevron-down`, `plus` y `minus`, no glifos tipográficos (salvo el `+`/`−`
  del acordeón, que el documento permite explícitamente). Se centralizan con el contrato del §05
  —`viewBox="0 0 24 24"`, sin `width`/`height`, `stroke="currentColor"`, `fill="none"`,
  `stroke-linecap="round"`, `aria-hidden`— verificado por test.
  Archivo: `web/src/components/primitives/icons.tsx` + test.

---

## Fase 2 · Chrome global

Transversal: habilita US-1, US-6, US-8 y US-9. Debe existir antes que cualquier ruta.

- [x] **T040 · Header adhesivo** — 74px, grilla `1fr auto 1fr`, fondo `rgba(245,241,234,0.92)` con
  `backdrop-filter: blur(14px)`, `border-bottom` hairline, `z-index: 60`. Logotipo wordmark.
  Archivo: `web/src/components/layout/header.tsx` + test.
  Desktop: nav · wordmark · utilidades. Bajo 900px: hamburguesa · wordmark · búsqueda+carrito
  (los rótulos, el idioma y «Ingresar» se ocultan; el panel es T043). El botón de carrito
  anuncia el total de unidades vía `header.cartCount`. Sets, contacto e ingresar enlazan a
  pathnames reservados: las páginas todavía no existen y el catch-all las 404.

- [x] **T041 [P] · Barra de anuncio** — sobre el header, fondo ink, mono 11px `tracking 0.18em`,
  desactivable por configuración.
  Archivo: `web/src/components/layout/announcement-bar.tsx` + test.
  El interruptor es `NEXT_PUBLIC_ANNOUNCEMENT=on|off` hasta que el backend administre las
  promociones (pregunta abierta 3). A 700px los tres mensajes se apilan: no caben en una línea
  a 360px.

- [x] **T042 · Selector de idioma** → US-6, AC-7
  Cambia el locale con `router.replace` de `next-intl` (navegación cliente, sin recarga).
  Archivo: `web/src/components/layout/language-switcher.tsx`.
  Depende de T026, T040.
  Conserva el pathname y los params (`/es/catalogo/[slug]` → `/en/catalogue/[slug]`). El carrito
  vuelve de `localStorage` tras el remontaje del layout (ADR-0002).

- [x] **T043 · Menú móvil (<900px)** — hamburguesa de 34px dibujada con tres reglas de 1px, panel a
  pantalla completa `z-index: 110`, enlaces Cormorant 30px con divisor, selector de idioma y CTA de
  WhatsApp al pie. Foco atrapado.
  Archivo: `web/src/components/layout/mobile-menu.tsx` + test.
  Escape cierra y `useFocusTrap` devuelve el foco al hamburguesa. Un enlace también cierra. El FAB
  se oculta mientras el overlay está abierto.

- [x] **T044 [P] · Footer** — `1.4fr 1fr 1fr 1fr`; dos columnas bajo 1140px; una bajo 700px.
  Archivo: `web/src/components/layout/footer.tsx` + test.
  Cuatro bloques: marca, tienda (`PRIMARY_NAV`), cuenta (ingresar + contacto) y WhatsApp. Sin
  Instagram ni legales: no están en las rutas de Fase 1 y no se inventaron destinos.

- [x] **T045 [P] · Botón flotante de WhatsApp** → US-8
  Fijo abajo a la derecha (26px), `z-index: 80`, fondo ink con punto success de 8px; el hover
  invierte a fondo `#4CA455` con texto ink.
  Archivo: `web/src/components/layout/whatsapp-fab.tsx` + test.
  Depende de T023.
  El mensaje precargado es `whatsapp.general`. Se oculta si hay overlay (menú, búsqueda, carrito).

- [x] **T046 · Iconografía SVG** → §05 del PDF
  Componentes SVG inline de trazo (`viewBox="0 0 24 24"`, `stroke="currentColor"`, `fill="none"`,
  sin `width`/`height` fijos): search, shopping-bag, user, x, plus, minus, chevron-down, whatsapp.
  Decorativos con `aria-hidden="true"`; los que son único contenido de un control, con `aria-label`.
  Prohibido: emojis, fuentes de iconos, PNG, relleno sólido.
  Archivos: `web/src/components/icons/index.tsx` + test.
  WhatsApp: no hay el SVG oficial y el §05 prohíbe redibujarlo, así que se envía el punto success
  de 8px que el documento admite como sustituto. La hamburguesa son tres reglas de 1px, no un SVG.

---

## Fase 3 · US-1 · Home (P0)

- [x] **T050 · Ruta y hero** — `clamp(40 → 104px)`, bajada, doble CTA, arte 3:2, contadores.
  Un solo `<h1>` (AC-14).
  Archivos: `web/src/app/[locale]/page.tsx`, `web/src/components/home/hero.tsx` + test.
  El arte es el placeholder diagonal del §05 (pregunta abierta 2). El contador de referencias
  sale del catálogo vivo (`{count}+`).

- [x] **T051 [P] · Marquesina de marcas** — 34s lineal infinita; detenida con reduced motion.
  Archivo: `web/src/components/home/brand-marquee.tsx` + test.
  Marcas desde `getFacets()`, no desde fixtures. El track se duplica; `[data-marquee]` es el
  gancho de AC-16.

- [x] **T052 [P] · Familias olfativas** — `repeat(auto-fit, minmax(min(100%, 230px), 1fr))`,
  divisores por `gap: 1px` sobre fondo hairline, numeración en accent-gold.
  Archivo: `web/src/components/home/olfactive-families.tsx` + test.
  Por ahora enlazan a `/catalogo` sin query: T062 formaliza el filtro en la URL.

- [x] **T053 · Destacados** — reutiliza `product-card` (T060).
  Archivo: `web/src/components/home/featured.tsx`.
  Depende de T060.
  Primeros 4 con stock.

- [x] **T054 [P] · Servicios y club** — `minmax(min(100%, 250px), 1fr)`.
  Archivos: `web/src/components/home/{services,club}.tsx` + tests.

- [x] **T055 · E2E de la home** → US-1, AC-14
  Archivo: `web/e2e/home.spec.ts`.

---

## Fase 4 · US-2 + US-3 · Catálogo y filtros (P0)

- [x] **T060 · Tarjeta de producto** — imagen 3/3.7 con borde hairline, marca+tamaño en mono,
  nombre Cormorant 21px, notas, fila precio + botón terciario. Hover: borde de imagen a ink y
  nombre a accent-gold, **sin escala ni elevación**. Estados agotado y skeleton.
  `alt` descriptivo obligatorio (AC-20).
  Archivo: `web/src/components/catalog/product-card.tsx` + test de los cinco estados.
  Depende de T028, T030.
  Agregar ya suma al store y abre el overlay `cart` (el drawer visual es T080; el toast es T081).

- [x] **T061 · Grilla y ruta del catálogo** — `repeat(auto-fill, minmax(250px, 1fr))`, gap 30/26px,
  barra lateral 268px + `minmax(0, 1fr)`. Renderizada como lista (RNF-2).
  Archivos: `web/src/app/[locale]/catalogo/page.tsx`, `web/src/components/catalog/product-grid.tsx`.

- [x] **T062 · Filtros en la URL** *(test-first)* → AC-9
  Parseo y serialización de filtros y orden a `searchParams`, con ida y vuelta verificada.
  Archivos: `web/src/lib/catalog/search-params.ts` + `__tests__/search-params.test.ts`.

- [x] **T063 · Barra lateral de filtros** → US-3
  Grupos con encabezado eyebrow; chips toggle con `aria-pressed`; chip deshabilitado al 40% cuando
  la combinación no arroja resultados.
  Archivo: `web/src/components/catalog/filter-sidebar.tsx` + test.
  Depende de T030, T062.

- [x] **T064 [P] · Filtros activos y orden** — chips removibles sobre la grilla y select de
  ordenamiento con línea inferior.
  Archivos: `web/src/components/catalog/{active-filters,sort-select}.tsx` + tests.

- [x] **T065 · Cuatro estados de lista** → RF-1, AC-10
  Carga (skeleton diagonal), vacío (mensaje + CTA de WhatsApp), error (mensaje + reintentar) y
  resultado.
  Archivos: `web/src/components/catalog/{empty-state,error-state}.tsx` + tests.

- [x] **T066 · Responsive del catálogo** → AC-17
  900–1139px: la barra de filtros pasa sobre la grilla y se desactiva el sticky. <900px: una columna.
  *Prueba: E2E multi-viewport.*

- [x] **T067 · E2E del catálogo** → AC-9, AC-10
  Filtrar, combinar, quitar un filtro, recargar la URL filtrada y llegar al estado vacío.
  Archivo: `web/e2e/catalog.spec.ts`.

---

## Fase 5 · US-4 · Ficha de producto (P0)

- [x] **T070 · Ruta y layout a dos columnas** — packshot 4:5 (máx. 62vh) + 3 miniaturas 1:1,
  columna izquierda adhesiva a `top: 74px`; derecha con `padding: clamp(30 → 48px)`.
  Archivo: `web/src/app/[locale]/catalogo/[slug]/page.tsx`.

- [x] **T071 [P] · Galería** — miniaturas `repeat(3, 1fr)` gap 12px, `srcset` 400/800/1200/1600,
  `loading="lazy"` salvo la primera, dimensiones explícitas para evitar CLS.
  Archivo: `web/src/components/product/gallery.tsx` + test.

- [x] **T072 [P] · Pirámide olfativa y tabla de especificaciones** — una columna bajo 560px.
  Archivos: `web/src/components/product/{olfactive-pyramid,spec-table}.tsx` + tests.

- [x] **T073 · Bloque de compra** — precio Cormorant `clamp(28 → 40px)`, estado de stock, stepper y
  botón primario; sin stock ofrece consulta por WhatsApp.
  Archivo: `web/src/components/product/purchase-block.tsx` + test.
  Depende de T024, T029.

- [x] **T074 [P] · Acordeón de ficha** — descripción, envíos y devoluciones, cuerpo a máx. 56ch.
  Archivo: `web/src/components/product/details-accordion.tsx`.
  Depende de T031.

- [x] **T075 [P] · Relacionados** — reutiliza `product-card`.
  Archivo: `web/src/components/product/related.tsx`.

- [x] **T076 · E2E de la ficha** → US-4, AC-14, AC-20
  Archivo: `web/e2e/product.spec.ts`.

---

## Fase 6 · US-5 · Carrito y drawer (P0)

- [x] **T080 · Drawer de carrito** → AC-11
  Panel derecho de 420px (máx. 92vw), `z-index: 101`, `slideIn` 300ms
  `cubic-bezier(0.22,1,0.36,1)`, backdrop `rgba(20,16,14,0.5)`. **Foco atrapado**; Escape cierra y
  devuelve el foco al botón de carrito. Estado vacío en Cormorant 24px itálica.
  Archivo: `web/src/components/cart/cart-drawer.tsx` + test de foco.

- [x] **T081 · Agregar al carrito** → AC-5
  Abre el drawer, incrementa el contador del header y dispara un toast con `role="status"`.
  El contador se renderiza tras la hidratación para evitar desajuste servidor/cliente.
  *Prueba: componente + E2E.*

- [x] **T082 [P] · Página de carrito** — filas `2.4fr 1fr 1fr 0.4fr`; apiladas sin encabezado de
  tabla bajo 700px. Aside de resumen 380px, gap `clamp(28 → 54px)`.
  Archivos: `web/src/app/[locale]/carrito/page.tsx`, `web/src/components/cart/{cart-line,cart-summary}.tsx` + tests.

- [ ] **T083 [P] · Campo de cupón** — input en caja; mensaje mono 10.5px en success
  («Cupón aplicado · −10%») o danger («Cupón inválido»), sin cambiar el borde en el caso inválido.
  Archivo: `web/src/components/cart/coupon-field.tsx` + test.

- [x] **T084 · Cierre por WhatsApp** → US-8
  El CTA del carrito construye el mensaje con el detalle del pedido.
  Depende de T023.

- [x] **T085 · E2E del carrito** → AC-5, AC-6, AC-11
  Agregar, ajustar cantidad, quitar, recargar y comprobar que el carrito sobrevive.
  Archivo: `web/e2e/cart.spec.ts`.

---

## Fase 7 · US-7 · Búsqueda global (P1)

- [x] **T090 · Trigger de búsqueda** — botón de texto con `border-bottom`; en móvil se reduce al
  icono de 13px.
  Archivo: `web/src/components/search/search-trigger.tsx`.

- [x] **T091 · Overlay** → AC-12
  Backdrop `rgba(20,16,14,0.55)` + `blur(3px)`, panel superior con `fadeUp` 280ms, input Cormorant
  40px con subrayado ink, **foco automático al abrir y devuelto al trigger al cerrar**. Cierra con
  backdrop, Escape o Enter.
  Archivo: `web/src/components/search/search-overlay.tsx` + test de foco.

- [x] **T092 [P] · Sugerencias y resultados en vivo** — chips de nota y marca; desde 2 caracteres,
  hasta 4 resultados en `minmax(220px, 1fr)` con marca, nombre y precio.
  Archivo: `web/src/components/search/live-results.tsx` + test.
  Depende de T020.

- [x] **T093 · Enter navega al catálogo filtrado**
  Depende de T062.

- [x] **T094 · E2E de búsqueda** → AC-12
  Archivo: `web/e2e/search.spec.ts`.

---

## Fase 8 · Pulido y cierre

- [x] **T100 · E2E de i18n** → US-6, AC-6, AC-7
  Cambiar de idioma traduce toda la UI visible, **no produce recarga completa** (comprobado sin
  evento de navegación dura) y **no pierde el carrito**.
  Archivo: `web/e2e/i18n.spec.ts`.

- [x] **T101 · Elasticidad de copy** → AC-17, RNF-8, US-9
  Mismo viewport de 360px en `es` y en `en`: sin scroll horizontal ni texto desbordado en
  navegación, botones y encabezados. El inglés corre 15–30% más largo.
  Archivo: `web/e2e/copy-elasticity.spec.ts`.

- [x] **T102 · Barrido de accesibilidad con axe** → AC-13
  `@axe-core/playwright` en cada ruta de Fase 1 × cada locale. Cero violaciones críticas o serias.
  Archivo: `web/e2e/a11y.spec.ts`.

- [x] **T103 [P] · Áreas táctiles** → AC-15
  Todo control interactivo mide ≥44×44px a 360px.
  Archivo: `web/e2e/touch-targets.spec.ts`.

- [x] **T104 [P] · Reduced motion** → AC-16
  Con `prefers-reduced-motion: reduce` emulado, la marquesina está detenida.
  Archivo: `web/e2e/reduced-motion.spec.ts`.

- [x] **T105 [P] · Un solo `<h1>` por ruta** → AC-14
  Archivo: `web/e2e/semantics.spec.ts`.

- [x] **T106 [P] · Contraste de `accent-gold`** → RNF-2
  Regla de lint o test que impida usar accent-gold en texto <24px, donde su 4.4:1 es insuficiente.

- [x] **T107 [P] · Metadatos y SEO** — `metadata` por ruta y locale, `hreflang` entre `/es` y `/en`,
  Open Graph 1200×630, favicon (SVG + PNG 32/180/512).
  Archivos: `web/src/app/[locale]/**/page.tsx`, `web/public/*`.

- [x] **T108 · Verificación final** → AC-19
  `/verify` en verde desde un árbol limpio, con Node ausente del host.

- [x] **T109 · Persistir contexto**
  Completar `.ai/stack.md` (stack real + comandos Docker), `.ai/architecture.md` (componentes y
  flujos), `.ai/conventions.md` (estructura, naming, patrones, convenciones de test) y
  `.ai/glossary.md` (familia olfativa, pirámide, concentración, packshot). Anotar en
  `.ai/lessons.md` los gotchas que aparezcan.

- [x] **T110 · Actualizar `progress.md`**
  Estado final de la Fase 1 y siguiente paso: spec de Fase 2 (checkout, login, registro, cuenta,
  contacto) y el servicio `api/`.

---

## Dependencias

```
Fase 0 ─────────────────────────────► todo lo demás
  T001 → T002 → T003 → T006
  T001 → T004, T005 → T007

Fase 1
  T010 → T011      T012 → T013      T013 → T014, T015, T016
  T018 → T019 → T020 → T021, T024
  T020 → T092
  T026 → T027, T042
  T028, T030 → T060        T029 → T073        T031 → T074

Fase 2 (chrome)  ── requiere 1a, 1c, 1d ──► Fases 3-7
  T023 → T045, T084

Fase 3  requiere T060 (para T053)
Fase 4  requiere T028, T030 · T062 → T063, T093
Fase 5  requiere T024, T029, T031, T060
Fase 6  requiere T024, T025, T029
Fase 7  requiere T020, T025, T062

Fase 8  requiere todas las anteriores
```

Camino crítico: `T001 → T002 → T003 → T007 → T013 → T020 → T024 → T040 → T060 → T080 → T108`.

## Definition of Done

Una tarea está terminada cuando:

1. Su test acompañante existe, es específico y pasa. Los marcados *test-first* se vieron fallar antes.
2. `npm run verify` pasa dentro de Docker (typecheck + lint + test + build). Los fallos se arreglan
   en la raíz: **no** se debilita, salta ni borra un test para ponerlo en verde.
3. Los valores de diseño salen de `theme.css`, nunca de literales arbitrarios en las clases.
4. No hay cadenas de UI literales: todo pasa por los diccionarios de i18n (lo verifica el lint).
5. El diff está acotado a la tarea; sin refactors oportunistas mezclados.

La **Fase 1 completa** está terminada cuando además:

6. Los 20 criterios de aceptación de `spec.md` tienen un test nombrado que los cubre y la suite
   entera pasa, incluido el E2E.
7. `/verify` pasa desde un clon limpio **sin Node instalado en el host** (AC-19).
8. `.ai/progress.md` está actualizado con el estado y el siguiente paso, y los documentos de `.ai/`
   afectados (`stack.md`, `architecture.md`, `conventions.md`, `glossary.md`) ya no dicen `_TBD_`.
