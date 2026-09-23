# Progress

## Estado actual · 2026-09-23 (sesión 14) — 003 hero + marquesina (T210–T213)

**483 tests**, E2E **105 passed / 15 skipped** en 4 viewports. Gate typecheck + lint +
test + build en verde.

Hero y marquesina alineados al prototipo. T083 sigue bloqueada.

Siguiente: spec de Fase 2 (checkout, login, registro, cuenta, contacto) y el
servicio `api/`.

### 003 · Hero y marquesina (T210–T213)

- Stats (referencias / despacho / valoración) dentro de la columna de copy,
  debajo de los CTAs. Valor arriba, label abajo.
- CTA WhatsApp con `WhatsappDot` 8px. Kicker con raya oro 32×1px.
- «Se recuerda.» en `text-accent-gold` (h1 ≥40px, RNF-2).
- Imagen derecha a sangre (`Packshot fill`): llena la columna y toca la
  marquesina. Caption superpuesta.
- Marquesina `bg-surface-raised`, marcas `11px` nowrap.

## Sesión 13 · 2026-09-23 — 002 pie de home (T200–T205)

**483 tests**, E2E **101 passed / 15 skipped** en 4 viewports. Gate typecheck + lint +
test + build en verde.

Cierre de home fiel al prototipo `QUUhcHp24QBtXkUG8sHPDj`: Club → franja Envíos /
Pagos / Mayorista → footer + FAB. T083 sigue bloqueada (reglas del cupón).

Siguiente: spec de Fase 2 (checkout, login, registro, cuenta, contacto) y el
servicio `api/`.

### 002 · Club, franja y footer (T200–T205)

- Club reescrito: kicker **Sparks Club** oro 24px, h2, CTAs `/registro` e
  `/ingresar`, beneficios `01`–`04`. Sin WhatsApp. Copy del JS del proto
  (Franklin, no Palermo).
- `commerce-strip.tsx` entre Club y footer. Oro ≥24px (RNF-2).
- Footer: wordmark 28px sin bajada, redes `sparks.insumos`, columnas Tienda /
  Cuenta / Ayuda en oro 24px, links 13.5px light, barra de copyright. Legales
  sin href. FAB `border-canvas/20`.
- TikTok a 38px de ancho → `min-w-11`. Heading «Todo el país» vs Services →
  `{ exact: true }` en E2E.
- Rutas reservadas: `/registro` → `register`, `/cuenta` → `account` (404
  hasta Fase 2).

## Sesión 12 · 2026-09-23 — spec/plan 002 corregido

El club **existe y está mal**. Entre club y footer falta la franja Envíos / Pagos /
Mayorista. Footer y FAB no calzan el prototipo (leído del artifact
`QUUhcHp24QBtXkUG8sHPDj` el 2026-09-23).

Escrito entonces: spec + plan 002. Copy del prototipo (no del OCR): kicker
**Sparks Club**, retiro en **Franklin**, redes `sparks.insumos`. Oro a ≥24px.

## Sesión 11 · 2026-09-22 — Fase 8 pulido (T100–T110)

**483 tests**, E2E **97 passed / 15 skipped** en 4 viewports (axe, touch, copy, semantics y
reduced-motion sólo en mobile-360). Gate typecheck + lint + test + build en verde.

Fase 1 del storefront **cerrada** salvo **T083** (cupón: reglas sin definir). Siguiente:
spec de Fase 2 (checkout, login, registro, cuenta, contacto) y el servicio `api/`.

### Pulido (T100–T110)

- E2E i18n: cambio ES→EN sin `load` extra; el carrito sobrevive; hreflang es-AR / en / x-default.
- Copy a 360px, un `h1` por ruta, marquesina detenida con reduced-motion, axe sin critical/serious.
- Controles ≥44×44 (`min-h-11`). El vacío del carrito «Ver catálogo» era 10px — `inline-flex min-h-11`.
- Gold sólo ≥24px (`accent-gold.test.ts`). Stock badge y footer subieron contraste (`text-ink`, `canvas/70`).
- SEO: `seoMetadata()`, OG 1200×630, favicon SVG + PNG 32/180/512. `NEXT_PUBLIC_SITE_URL` opcional.
- Contexto persistido: `conventions.md`, `glossary.md`, `architecture.md` (búsqueda + SEO),
  `stack.md` (SITE_URL + comandos E2E), `web/README.md` ya no es el boilerplate de create-next-app.

## Sesión 10 · 2026-09-22 — Fase 7 búsqueda (T090–T094)

**478 tests**, E2E 84/84 en 4 viewports (búsqueda 12). Gate typecheck + lint + test + build en verde.

### Búsqueda (T090–T094)

- Trigger extraído a `search-trigger.tsx`: `id="header-search"`, `aria-controls="search-overlay"`.
  Desktop: texto + underline; <900px: icono 13px.
- Overlay: backdrop `rgba(20,16,14,0.55)` + blur 3px, panel `fadeUp` 280ms, input Cormorant 40px.
  Foco al input al abrir; Escape / backdrop / close restauran el trigger (AC-12).
- Chips de nota y marca desde `getFacets` + `listProducts` (ADR-0003). Desde 2 caracteres, máx. 4
  resultados en `minmax(220px, 1fr)` (marca, nombre, precio).
- Enter hace `location.assign` a `/es/catalogo?q=` · `/en/catalogue?q=` (ADR-0008).
- E2E en `e2e/search.spec.ts`. Tras añadir islas cliente hay que **reiniciar** el contenedor `web`
  si ya estaba levantado: el HTML viejo no trae `#header-search`.

## Sesión 9 · 2026-09-22 — Fase 6 carrito (T080–T085, sin T083)

**466 tests**, E2E 72/72 en 4 viewports (carrito 20). Gate typecheck + lint + test + build en verde.

Quedan **17 tareas** (T090–T110 + T083). T083 sigue bloqueada por las reglas del cupón.

### Carrito (T080–T082, T084, T085)

- Drawer 420px / 92vw, z-101, `slideIn`, foco atrapado, Escape devuelve el foco al trigger.
- Agregar (tarjeta y ficha) usa `useAddToCart`: persistir + overlay + toast `role="status"`.
- El contador del header espera `hydrated` (`data-hydrated` en `#header-cart`).
- `/es/carrito` · `/en/cart`: isla `CartView`, filas `2.4fr 1fr 1fr 0.4fr`, aside 380px.
- Checkout: `buildOrderMessage` + `wa.me` con el detalle. Sin cupón (T083).
- El E2E del carrito hidrata porque `allowedDevOrigins` incluye `web` (ADR-0008).

## Sesión 8 · 2026-09-22 — Fase 5 ficha (T070–T076)

**444 tests**, E2E ficha 16/16 en 4 viewports. Gate typecheck + lint + test + build en verde.

Quedan **22 tareas** (T080–T110). T083 sigue bloqueada por las reglas del cupón.

### Ficha (T070–T076)

- `/es/catalogo/[slug]` · `/en/catalogue/[slug]`: dos columnas desde 900px, galería adhesiva
  a `top: 74px`, columna de info con padding `clamp(30 → 48px)`.
- Galería 4:5 (máx. 62vh) + 3 miniaturas 1:1. Sin fotos reales: placeholder §05. `srcset`
  400/800/1200/1600 ya cableado para cuando existan archivos.
- Pirámide, ficha técnica, acordeón (descripción abierta), relacionados con `ProductCard`.
- Compra: stepper + primario. Sin stock: WhatsApp `whatsapp.stock`.
- El listado del catálogo se movió a `catalogo/(grid)/` para que su `loading.tsx` no cubra
  la ficha (un `notFound()` con el skeleton del padre streamado no pinta el 404).

## Sesión 7 · 2026-09-22 — Fase 4 catálogo (T061–T067)

**427 tests**, E2E catálogo 24/24 en 4 viewports (360 / 900 / 1140 / 1440). Gate
typecheck + lint + test + build en verde.

Quedan **29 tareas** (T070–T110). T083 sigue bloqueada por las reglas del cupón.

### Catálogo (T061–T067)

- Ruta `/es/catalogo` · `/en/catalogue`: h1, sidebar 268px + grilla `auto-fill minmax(250px, 1fr)`.
- Filtros en la URL (`family`, `brand`, `size`, `priceMin`, `priceMax`, `q`, `sort`).
- Cada chip es un `Link` al query siguiente (ADR-0007): `router.replace` tira el search en
  este pathname, y los `onClick` no hidrataban en Playwright.
- Chip que vaciaría la grilla: `span` al 40%, no enlace (RF-2). El vacío se alcanza por URL
  compartida (Gourmand + V.V Love) y muestra WhatsApp (AC-10).
- Debajo de `xl` (1140) la barra se apila sobre la grilla y pierde el sticky. Overlay
  `FilterDrawer` existe y está testeado, pero no se monta en la página.
- Sort: `<select>` + `location.assign`. Órdenes provisionales (RF-3).
- Familias de la home ya aterrizan en `/catalogo?family=…`.

## Sesión 6 · 2026-09-22 — Home + tarjeta (T050–T055, T060)

**394 tests**, E2E home en 4 viewports. La home deja de ser un placeholder: hero, marquesina,
familias, destacados, servicios y club. La tarjeta de catálogo existe y la reutilizan los
destacados.

### Home (T050–T055) y tarjeta (T060)

- Hero: un solo `h1`, CTA al catálogo y a WhatsApp, arte 3:2 placeholder, tres contadores.
- Marquesina: marcas de `getFacets()`, track duplicado, `data-marquee` para reduced motion.
- Familias: grilla auto-fit, divisores de 1px. Enlazan a `/catalogo` (el query llega con T062).
- Destacados: 4 productos con stock, `ProductCard`.
- Servicios + club en ink.
- La tarjeta agrega al carrito y abre el overlay; el panel del drawer todavía no está.

## Sesión 5 · 2026-09-22 — Fase 2 chrome completa (T040–T046)

**382 tests en verde**, gate pasando. Esta sesión cerró el layout compartido: menú móvil con foco
atrapado, footer de cuatro columnas y el FAB de WhatsApp. El home sigue siendo un placeholder.

### Chrome restante (T043, T044, T045)

- **Menú móvil** (`mobile-menu.tsx`): dialog a pantalla completa `z-110`, enlaces Cormorant 30px
  con divisor, idioma, ingresar y CTA `wa.me` al pie. Escape cierra y el foco vuelve al
  hamburguesa. Comprobado a ~360px en el navegador.
- **Footer** (`footer.tsx`): `1.4fr 1fr 1fr 1fr` / 2 cols <1140 / 1 col <700, fondo ink, wordmark
  invertido. Tienda y cuenta reutilizan las rutas del chrome; WhatsApp usa el mensaje general.
- **FAB** (`whatsapp-fab.tsx`): fijo 26px, `z-80`, punto success, hover a `#4CA455`. Se oculta
  cuando hay overlay para no tapar el menú ni, más adelante, el drawer.

`useFocusTrap` / `useScrollLock` viven en `web/src/lib/ui/overlay.ts` y los comparte el menú
(el drawer y la búsqueda los reutilizarán).

## Sesión 4 · 2026-09-22 — Fase 2 empezada: chrome T040–T042 + T046

**366 tests en verde**, gate completo pasando. Esta sesión montó el layout compartido: barra de
anuncio, header adhesivo, selector de idioma, skip-link e hidratación del carrito. El home
sigue siendo un placeholder; el catálogo 404s (T061) **con el chrome alrededor**, que es lo
que se quería.

### Chrome (T040, T041, T042, T046)

El layout de `[locale]` ahora envuelve cada página con:

- `CartHydration` — lee `localStorage` en un efecto (`skipHydration` del store).
- Skip-link al `#contenido`.
- Barra de anuncio, apagable con `NEXT_PUBLIC_ANNOUNCEMENT=off`.
- Header 74px adhesivo, grilla `1fr auto 1fr` / `auto 1fr auto` bajo 900px.

Comprobado en el navegador: `/` → `/es`, el switch ES→EN traduce nav, anuncio y carrito, y
`/en/catalogue` (404) pasa a `/es/catalogo` sin recarga completa. Sets, contacto e ingresar
enlazan a pathnames reservados y dan 404 hasta la Fase 2 de producto.

Iconos del §05 viven en `web/src/components/icons/`. WhatsApp es el punto success de 8px (no hay
SVG oficial y está prohibido redibujarlo). Hamburguesa: tres reglas de 1px.

Pendiente de esta fase: T043 menú móvil (el trigger ya está), T044 footer, T045 FAB de WhatsApp.

## Sesión 3 · 2026-09-22 — Fase 1 completa hasta el bloque 1d

**328 tests en verde**, gate completo (`typecheck`, `lint`, `test`, `build`) pasando, smoke E2E en
los cuatro viewports. Hechos en esta sesión: T017–T025 (datos y estado), T026–T027 (i18n) y
T028–T031 (primitivas del §03).

### Bloque 1d · primitivas del §03

`web/src/components/primitives/` tiene los doce componentes del §03: los tres botones, los cuatro
controles de formulario, chip (en sus dos formas), badge, skeleton, acordeón y toast. Más
`icons.tsx`, que no estaba en el plan: la regla de lint contra texto literal marcó el glifo `✕` y
el §05 en efecto pide SVG de trazo, así que se centralizaron con el contrato del documento
verificado por test.

Lo que estos tests **no** cubren: los valores en píxeles. `padding: 17px 30px`, la altura táctil de
48px y los colores de hover son CSS, y jsdom no calcula Tailwind. Se verifican con un motor real en
la fase de Playwright. Lo que sí queda blindado es comportamiento y semántica: `aria-pressed`,
`aria-expanded`/`aria-controls`, `aria-invalid` + `aria-describedby`, `aria-busy`, regiones live,
foco de teclado y ausencia de violaciones de axe en cada estado.

### Bloque 1b · datos y estado

`web/src/lib/api/contract.ts` es el contrato que el futuro servicio `api/` deberá cumplir: los
tipos se infieren de los esquemas Zod, nunca al revés. Detrás hay dos implementaciones de
`CatalogRepository` —`mock-repository` sobre los fixtures y `http-repository` que valida toda
respuesta contra el contrato— y **una sola suite de 47 aserciones corre contra las dos**. El
backend falso de ese test es la descripción ejecutable de lo que `api/` tiene que hacer.

El repositorio recibe el `locale` y devuelve la copia ya traducida, igual que hará `api/` con
`Accept-Language`. Marca y nombre de producto no se traducen; familia y concentración viajan como
slug y se traducen en el diccionario.

El carrito persiste **sólo referencias** (`productId`, `slug`, `quantity`), validadas con Zod al
hidratar; `resolveCart()` las une con el producto vivo, recalcula el precio y reporta aparte lo
agotado o descatalogado. Así un carrito viejo no congela un precio y nada dependiente del idioma
llega al disco (AC-15).

### Bloque 1c · i18n

Rutas con prefijo siempre (`/es`, `/en`) y nombres de ruta traducidos (`/es/catalogo` ↔
`/en/catalogue`). Comprobado en el navegador: `/` redirige 307 a `/es`, ambos locales responden
200 con su diccionario, `/es/no-existe` da 404, y los tokens de diseño siguen aplicándose bajo el
nuevo layout.

Los diccionarios tienen un test de paridad: mismas claves, mismos placeholders ICU, sin cadenas
vacías, y una lista explícita de las claves que legítimamente coinciden en ambos idiomas — si
aparece una nueva coincidencia, el test obliga a decidir si es copia sin traducir.

`no-literal-string` está activo como **error** sobre `src/components/**` y `src/app/**`, y se
comprobó con un componente sonda que dispara con texto JSX, `alt` y `aria-label`.

### Fuentes versionadas (ADR-0006)

`next/font/google` descargaba en cada build y hacía fallar el gate al azar. Ahora los diez
`.woff2` están en `web/src/styles/fonts/` y se usa `next/font/local`. **Comprobado con la red
desactivada**: `docker run --network none … npm run build` termina en verde.

Se envía sólo el subset latino: con `latin-ext` el total daba 204KB contra un presupuesto de
180KB, y ninguno de los dos idiomas del sitio usa un codepoint suyo. **136KB** medidos.

Los archivos los regenera `docker compose -f docker/docker-compose.yml run --rm fonts`, a demanda.

### Decisiones que faltan (ver preguntas abiertas 4 y 5 de la spec)

- **Cupón (T083):** sin reglas definidas, el store quedó sin cupón. Bloquea T083.
- **Ordenamientos del catálogo (RF-3):** no se pudieron leer del prototipo (los clics dentro del
  iframe del artifact no registran). `contract.ts` lleva un conjunto provisional marcado como tal.
  Nico decidió dejarlo así y confirmarlo antes de T063.

## Sesión 2 · 2026-09-22 — Fase 0 + bloque 1a completos

Entorno Docker en pie y sistema de diseño implementado. **92 tests en verde**, gate completo
pasando. Hechos: T001–T007 (setup) y T010–T016 (tokens, fuentes, animaciones, export JSON).

### Bloque 1a · sistema de diseño

`web/src/styles/theme.css` es la capa de tokens: paleta del §01, escala tipográfica fluida del
§02 (15 niveles con su `clamp`, `line-height` y `tracking`), tres familias con sus fallbacks,
espaciado, los seis breakpoints y los defaults de movimiento. La paleta y la escala de radios de
Tailwind están **reemplazadas, no extendidas**: `bg-red-500` y `rounded-lg` sencillamente no
existen.

Lo verifican 90 tests que comparan el archivo contra las tablas del PDF, incluida la regla de que
no aparezca ningún color ni nivel tipográfico fuera del documento. Confirmado en el navegador: la
página sirve `--color-canvas` de fondo, Jost cargado y los `clamp` aplicados.

Presupuesto de fuentes (RNF-7): **120KB** de subset latino, dentro de los 180KB. `npm run
font-budget` lo mide.

```powershell
docker compose -f docker/docker-compose.yml up web                          # dev, hot reload
docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run verify
docker compose -f docker/docker-compose.yml run --rm e2e                    # Playwright
```

Verificado a mano: `typecheck`, `lint`, `test` (2 tests) y `build` pasan; el smoke E2E pasa en los
cuatro viewports (360/900/1140/1440); la etapa `runner` de producción responde 200.
**No hay Node ni navegadores instalados en el host** — todo salió de contenedores.

### Desvíos respecto del plan, ya reconciliados en los documentos

| Qué | Por qué |
|-----|---------|
| Next **16.3.5**, no 15 | Era la estable y todo el stack la soporta. ADR-0001 actualizado |
| `axe-core` directo en vez de `vitest-axe` | El wrapper está sin mantener desde 2022 y sus tipos rompen con Vitest 5. ADR-0005 actualizado |
| Sin `vite-tsconfig-paths` | Vite ya resuelve los paths de tsconfig de forma nativa |
| `WEB_PORT` configurable | El 3000 del host lo ocupa otro proyecto |
| `@types/node` a `^22` | Debe seguir al runtime (Node 22) y a Vitest 5 |
| Cormorant en pesos 400 y 500 | El §02 lista 300–600, pero la escala sólo usa 400, el wordmark 500 y la itálica 400 |

Los gotchas que costaron tiempo están en `.ai/lessons.md`.

## Sesión 1 · 2026-09-22 — definición

El repositorio está vacío de código: sólo existen `.ai/` y `.cursor/`, y todavía no hay ningún
commit en `master`. La sesión de hoy fue de definición, no de implementación.

Se verificó el acceso a las dos fuentes de diseño (PDF de especificación técnica y prototipo
navegable de Claude) y se decidió con el usuario el alcance que el PDF no cubría.

### Decisiones tomadas con el usuario

| Tema | Decisión |
|------|----------|
| Origen de los datos | API propia en Docker, **a desarrollar después**. El storefront se construye contra un contrato definido ahora y resuelto con mocks |
| Checkout | Sin pasarela de pago; cierra coordinando el pago por WhatsApp |
| Autenticación | También queda para el backend futuro |
| Alcance Fase 1 | Home + Catálogo + Ficha + Carrito/Drawer. Checkout, login, registro, cuenta y contacto van a Fase 2 |
| Testing | Vitest + Testing Library + Playwright, todo dentro de Docker |

### Qué se escribió

- `.ai/specs/001-storefront-fase-1/spec.md` — 9 historias, 10 RF, 8 RNF, 20 criterios de
  aceptación verificables, 3 preguntas abiertas (todas de contenido, ninguna bloquea).
- `.ai/specs/001-storefront-fase-1/plan.md` — stack, estructura de archivos, capa de tokens,
  contrato de datos, i18n, Docker, estrategia de test por criterio, compromisos y riesgos.
- `.ai/specs/001-storefront-fase-1/tasks.md` — 62 tareas en 9 fases, con dependencias, camino
  crítico y Definition of Done.
- `.ai/decisions/0001` a `0005` — stack frontend, i18n, capa de datos desacoplada, Docker-first,
  estrategia de testing. Los cinco en estado `accepted`.
- `.ai/project.md` — completado (estaba en `_TBD_`).

El usuario aprobó spec y plan el 2026-09-22.

## Próximo paso

Aprobar [002](./specs/002-home-clubhouse-banner/plan.md) y correr `/tasks` (banner
clubhouse). Después: spec de Fase 2 (checkout, login, registro, cuenta, contacto) y `api/`.

**T083** sigue bloqueada hasta que existan reglas de cupón (pregunta abierta 4 de la spec).

El repositorio **sigue sin ningún commit**.

## Pendientes de contexto

`business-model.md` sigue en `_TBD_`. `architecture.md`, `stack.md`, `conventions.md` y
`glossary.md` ya describen lo que hay. Los bloques Standalone / Full stack / PRE deploy
de `architecture.md` siguen vacíos a propósito: no hay `api/` ni pipeline de publish.
