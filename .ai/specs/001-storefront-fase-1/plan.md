# Plan técnico · 001 Storefront Sparks Parfums — Fase 1

- **Estado:** aprobado (2026-09-22)
- **Fecha:** 2026-09-22
- **Spec:** [`spec.md`](./spec.md) · **Tareas:** [`tasks.md`](./tasks.md)
- **ADRs:** [0001](../../decisions/0001-stack-frontend.md) ·
  [0002](../../decisions/0002-i18n-next-intl.md) ·
  [0003](../../decisions/0003-capa-de-datos-desacoplada.md) ·
  [0004](../../decisions/0004-docker-first.md) ·
  [0005](../../decisions/0005-estrategia-de-testing.md) ·
  [0006](../../decisions/0006-fuentes-versionadas.md) ·
  [0007](../../decisions/0007-filtros-del-catalogo-como-enlaces.md)

## 1 · Enfoque

Tres ideas sostienen el plan:

**El PDF es un sistema de diseño, no una maqueta.** Define tokens con valores exactos, así que
se implementa como tal: una única capa de tokens (`@theme` de Tailwind v4) de la que derivan todos
los componentes, y tests que comparan esos tokens contra la tabla del PDF. Si alguien cambia un
hex a mano, el test falla. Esto es lo que hace cumplible RNF-1 y AC-1/AC-2/AC-3.

**El backend todavía no existe, pero el contrato sí.** El storefront nunca toca `fetch` directo ni
importa fixtures desde un componente. Habla con un repositorio tipado cuyo contrato se define con
Zod en un solo lugar; hoy lo resuelve un adaptador mock y mañana uno HTTP, seleccionado por variable
de entorno. Cuando llegue el backend en su contenedor, la única línea que cambia es
`API_MODE=http`. Ver [ADR-0003](../../decisions/0003-capa-de-datos-desacoplada.md).

**Docker no es el empaquetado, es el entorno.** Desarrollo, tests y el gate de calidad se ejecutan
dentro de contenedores; `.cursor/verify.json` invoca `docker compose`. La máquina del desarrollador
sólo necesita Docker. Ver [ADR-0004](../../decisions/0004-docker-first.md).

## 2 · Stack

| Pieza | Elección | Traza |
|-------|----------|-------|
| Framework | Next.js 16 · App Router · React 19 | Requisito del usuario |
| Lenguaje | TypeScript `strict` + `noUncheckedIndexedAccess` | Requisito del usuario · RNF-6 |
| Estilos | Tailwind CSS v4 (configuración CSS-first con `@theme`) | Requisito del usuario · RNF-1 |
| i18n | `next-intl` con rutas `/es` y `/en` | RF-7 · [ADR-0002](../../decisions/0002-i18n-next-intl.md) |
| Estado cliente | Zustand + middleware `persist` (carrito y UI) | RF-5 · AC-6 |
| Validación | Zod (contrato de API y variables de entorno) | RNF-6 · RF-10 |
| Tests unidad/componente | Vitest + Testing Library + `axe-core` | RNF-5 · [ADR-0005](../../decisions/0005-estrategia-de-testing.md) |
| Tests E2E | Playwright + `@axe-core/playwright` | RNF-5 · AC-13 |
| Calidad | ESLint 9 (flat) + Prettier + `prettier-plugin-tailwindcss` | Convención |
| Runtime | Docker · Node 22 alpine (dev/build) + imagen oficial de Playwright (tests E2E) | RNF-4 |

Sin librería de componentes. El diseño es rectangular, sin sombras y con un único radio; cualquier
UI kit aportaría más peso y estilos que desarmar que valor. Esto cumple el principio 4 de la
constitución (simplicidad) y el 7 (consistencia sobre novedad).

## 3 · Estructura de archivos

Respeta la convención Docker ya registrada en `.ai/architecture.md`: cada servicio es una carpeta
autocontenida con su `Dockerfile`, `docker-compose.yml`, `.dockerignore` y `.env.example`;
`docker/` sólo orquesta y nunca duplica Dockerfiles. El futuro backend entrará como `api/`.

```
web/                              # servicio storefront
├── Dockerfile                    # etapas: deps · dev · builder · runner · e2e
├── docker-compose.yml            # levanta sólo este servicio
├── .dockerignore
├── .env.example                  # API_MODE, API_BASE_URL, NEXT_PUBLIC_WHATSAPP_NUMBER
├── next.config.ts                # output: 'standalone' + plugin de next-intl
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.mjs
└── src/
    ├── app/
    │   ├── [locale]/
    │   │   ├── layout.tsx                    # barra de anuncio · header · footer · providers
    │   │   ├── page.tsx                      # US-1 home
    │   │   ├── catalogo/page.tsx             # US-2, US-3
    │   │   ├── catalogo/[slug]/page.tsx      # US-4
    │   │   └── carrito/page.tsx              # US-5
    │   └── globals.css                       # @import tailwind + @import theme
    ├── styles/
    │   ├── theme.css                         # @theme: TODOS los tokens del PDF
    │   └── animations.css                    # fadeUp · slideIn · marquesina + reduced-motion
    ├── components/
    │   ├── primitives/                       # §03 del PDF, uno por componente + sus estados
    │   │   ├── button-primary.tsx  button-secondary.tsx  button-tertiary.tsx
    │   │   ├── text-input.tsx      boxed-input.tsx        select.tsx
    │   │   ├── quantity-stepper.tsx  filter-chip.tsx      badge.tsx
    │   │   └── accordion.tsx       toast.tsx              skeleton.tsx
    │   ├── layout/                           # header, announcement-bar, mobile-menu, footer,
    │   │   │                                 # whatsapp-fab, language-switcher
    │   ├── catalog/                          # product-card, product-grid, filter-sidebar,
    │   │   │                                 # active-filters, sort-select, empty-state
    │   ├── product/                          # gallery, olfactive-pyramid, spec-table, related
    │   ├── cart/                             # cart-drawer, cart-line, cart-summary, coupon-field
    │   └── search/                           # search-trigger, search-overlay, live-results
    ├── lib/
    │   ├── api/
    │   │   ├── contract.ts                   # esquemas Zod — fuente de verdad del contrato
    │   │   ├── repository.ts                 # interfaz CatalogRepository
    │   │   ├── http-repository.ts            # adaptador para el backend futuro
    │   │   ├── mock-repository.ts            # adaptador actual
    │   │   └── index.ts                      # selección por API_MODE
    │   ├── cart/store.ts                     # Zustand + persist
    │   ├── ui/store.ts                       # drawer, overlay de búsqueda, menú móvil, toasts
    │   ├── format/price.ts                   # Intl.NumberFormat es-AR · AC-4
    │   ├── whatsapp.ts                       # constructor de enlaces wa.me · AC-18
    │   └── env.ts                            # validación Zod de variables de entorno
    ├── i18n/
    │   ├── routing.ts  request.ts
    │   └── messages/{es.json,en.json}        # diccionarios por clave · RF-7
    ├── fixtures/catalog.ts                   # datos de muestra del prototipo
    └── design-tokens.json                    # export JSON exigido por el §05 del PDF
docker/
└── docker-compose.yml            # stack completo: web (+ api cuando exista)
```

## 4 · Capa de tokens

`src/styles/theme.css` traduce el PDF a Tailwind v4 uno a uno. Fragmento representativo:

```css
@theme {
  --color-ink: #14100E;
  --color-canvas: #F5F1EA;
  --color-accent-gold: #8A6B32;
  --color-surface-raised: #FBF9F5;
  --color-text-muted: #3E3731;
  --color-text-meta: #6F665A;
  --color-border-hairline: rgb(20 16 14 / 0.12);
  --color-border-strong: rgb(20 16 14 / 0.28);

  --text-h1-hero: clamp(2.5rem, 7.4vw, 6.5rem);   /* 40 → 104px */
  --text-h1-hero--line-height: 0.92;
  --text-h1-hero--letter-spacing: -0.02em;

  --breakpoint-sm: 560px;   --breakpoint-md: 700px;   --breakpoint-lg: 900px;
  --breakpoint-xl: 1140px;  --breakpoint-2xl: 1440px; --breakpoint-3xl: 2160px;

  --radius-*: initial;              /* radio 0 en todo el sistema */
  --radius-chip: 999px;             /* excepción única del §04 */
}
```

Dos detalles no obvios:

- Los breakpoints por defecto de Tailwind se **reemplazan**, no se amplían. El PDF define seis
  umbrales propios y mantener los de Tailwind en paralelo garantiza divergencia.
- `--radius-*: initial` borra la escala de radios de Tailwind. Es la forma de que `rounded-lg`
  sencillamente no exista y nadie pueda introducir esquinas redondeadas por costumbre.

`design-tokens.json` se genera desde `theme.css` con un script (`npm run tokens:json`) y un test
falla si quedó desactualizado. El §05 del PDF pide el export en ambos formatos.

## 5 · Contrato de datos

Definido con Zod en `src/lib/api/contract.ts`. Es el artefacto que el backend futuro deberá
satisfacer, así que se versiona y se revisa antes de escribir el primer endpoint.

```ts
Product = {
  id, slug, brand, name,
  size: { ml: number, label: string },
  price: { amount: number, currency: 'ARS' },
  concentration, family, notes: { top[], heart[], base[] },
  description, stock: number, badge?: string,
  images: { packshot, thumbnails[], alt }
}
```

Endpoints que consumirá la Fase 1:

| Operación | Endpoint futuro | Uso |
|-----------|-----------------|-----|
| `listProducts(filters, sort)` | `GET /api/v1/products` | US-2, US-3 |
| `getProduct(slug)` | `GET /api/v1/products/{slug}` | US-4 |
| `getRelated(slug)` | `GET /api/v1/products/{slug}/related` | US-4 |
| `getFacets()` | `GET /api/v1/facets` | US-3 (familias, marcas, tamaños, rango de precio) |
| `search(query)` | `GET /api/v1/search?q=` | US-7 |

`mock-repository.ts` implementa las cinco operaciones sobre `fixtures/catalog.ts` con la misma
semántica de filtrado y orden. Los contract tests corren contra **ambos** adaptadores, de modo que
el día que el backend exista ya hay una suite que valida que cumple lo pactado.

El carrito y el cupón viven íntegramente en el cliente en Fase 1; el precio se recalcula siempre
desde el producto del repositorio, nunca desde el valor guardado en `localStorage` (evita que un
carrito viejo congele un precio desactualizado).

## 6 · i18n

`next-intl` con prefijo de ruta (`/es/...`, `/en/...`) por SEO: cada idioma necesita URL propia e
indexable en un e-commerce. El detalle delicado es AC-6 + AC-7: cambiar de idioma cambia el
segmento de ruta, lo que desmonta el layout.

Se resuelve así: el carrito se persiste en `localStorage` vía el middleware `persist` de Zustand,
por lo que sobrevive al remontaje; y el cambio se hace con `router.replace` del router de
`next-intl`, que es navegación cliente — no hay recarga completa. Ambas condiciones se verifican
en E2E, no por inspección. Detalle y alternativas descartadas en
[ADR-0002](../../decisions/0002-i18n-next-intl.md).

Regla de lint para AC-8: `eslint-plugin-i18next` (`no-literal-string`) sobre `src/components/**`,
que hace fallar el build ante cualquier texto literal en JSX.

## 7 · Docker

Un solo `Dockerfile` multi-etapa en `web/`:

| Etapa | Base | Para qué |
|-------|------|----------|
| `deps` | `node:22-alpine` | `npm ci` cacheado por `package-lock.json` |
| `dev` | `deps` | `next dev` con bind mount y volumen anónimo en `node_modules` |
| `builder` | `deps` | `next build` |
| `runner` | `node:22-alpine` | salida `standalone`, usuario no root |
| `e2e` | `mcr.microsoft.com/playwright:v1.5x-noble` | navegadores preinstalados |

Playwright va en una etapa aparte a propósito: su imagen pesa ~2GB y no tiene por qué contaminar
el ciclo de desarrollo diario. `docker/docker-compose.yml` orquesta; `web/docker-compose.yml`
levanta el servicio solo.

Comandos que quedarán documentados en `.ai/stack.md`:

```bash
docker compose -f docker/docker-compose.yml up web        # desarrollo, hot reload
docker compose -f docker/docker-compose.yml run --rm web npm run verify
docker compose -f docker/docker-compose.yml run --rm e2e npm run test:e2e
```

`.cursor/verify.json` se completa con esos comandos (hoy sus cuatro checks están vacíos y
deshabilitados), de forma que el gate de calidad del repo funcione sin Node local.

## 8 · Estrategia de test

Cada criterio de aceptación tiene dueño. Ningún AC queda sin prueba.

| Nivel | Herramienta | Cubre |
|-------|-------------|-------|
| Tokens | Vitest sobre `theme.css` parseado | AC-1, AC-2, AC-3 |
| Unidad | Vitest | AC-4 (`formatPrice`), AC-18 (`buildWhatsappUrl`), store de carrito |
| Componente | Vitest + Testing Library | AC-5, AC-11, AC-12 · estados de cada primitiva del §03 |
| Contrato | Vitest contra mock y HTTP | RF-10 · paridad de adaptadores |
| Accesibilidad | `vitest-axe` (componente) + `@axe-core/playwright` (ruta) | AC-13, AC-14 |
| E2E | Playwright | AC-6, AC-7, AC-9, AC-10, AC-16, AC-20 |
| Responsive | Proyectos Playwright a 360 / 900 / 1140 / 1440px | AC-15, AC-17 |
| Lint | ESLint | AC-8 |
| Gate | `npm run verify` en Docker | AC-19 |

Dos pruebas merecen mención porque son las que el PDF pide explícitamente y suelen olvidarse:
la **elasticidad de copy** (AC-17 corre el mismo viewport de 360px en `es` y en `en`, porque el
inglés es 15–30% más largo) y **reduced motion** (AC-16 usa el emulado de Playwright para
confirmar que la marquesina se detiene).

Los tests de componente se apoyan en props, no en red: en App Router la carga de datos vive en
server components, así que no hace falta MSW ni un mock de `fetch` global. Los E2E corren contra
`API_MODE=mock`, lo que los hace deterministas.

## 9 · Compromisos asumidos

**Tailwind v4 en vez de v3.** La configuración CSS-first hace que los tokens del PDF sean
literalmente el tema, sin un `tailwind.config.js` que duplique valores. El costo es que parte del
ecosistema de plugins aún apunta a v3. Como no usamos plugins de terceros, el riesgo es bajo.

**Prefijo de idioma en la ruta en vez de cookie.** La cookie evitaría el remontaje del layout, pero
deja los dos idiomas en la misma URL y eso es malo para SEO en un e-commerce. Pagamos el remontaje
y lo compensamos persistiendo el carrito.

**Zustand en vez de Context.** Un Context para el carrito re-renderiza todo el árbol suscrito en
cada cambio de cantidad, y persistirlo a `localStorage` requiere escribirlo a mano. Zustand da
ambas cosas en ~1KB. Es la única dependencia de estado del proyecto.

**Fuentes vía `next/font/google`.** Autoaloja y subsetea en tiempo de build, que es lo que exige el
§05, sin tener que versionar WOFF2 en el repo. A cambio, el build necesita red. Si eso molesta en
CI, la alternativa es descargar los WOFF2 una vez y pasar a `next/font/local`.

**Fase 1 sin las cinco rutas restantes.** Checkout, login, registro, cuenta y contacto quedan
diseñados pero sin implementar. Se acepta porque dependen del backend, que aún no existe.

## 10 · Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| El backend futuro no respeta el contrato | Alto — reescritura de la capa de datos | El contrato Zod es un entregable revisable *antes* de escribir el backend; los contract tests corren contra ambos adaptadores |
| Presupuesto de fuentes >180KB (RNF-7) | Medio | IBM Plex Mono no tiene variable font; medir en la primera tarea y, si se pasa, recortar a pesos 400/500 y subset latino |
| `accent-gold` tiene 4.4:1 — insuficiente para cuerpo de texto | Medio — accesibilidad | El PDF ya lo acota a ≥24px; se codifica como regla de lint de clases y se verifica con axe |
| Hot reload lento por bind mount en Windows | Bajo — fricción diaria | `WATCHPACK_POLLING=true` y volumen anónimo para `node_modules` |
| `Intl.NumberFormat('es-AR')` inserta espacio duro tras el `$` | Bajo — pero rompe AC-4 | `formatToParts` y ensamblado explícito; test unitario sobre la cadena exacta |
| Imagen de Playwright pesada | Bajo | Etapa y servicio separados; no se construye en el flujo de desarrollo |
| Faltan fotos y catálogo real | Medio — bloquea el contenido, no el código | Placeholder diagonal del §05 y fixtures; son preguntas abiertas 1 y 2 de la spec |

## 11 · Verificación del plan contra la constitución

| Principio | Cumplimiento |
|-----------|--------------|
| 1 · Contexto primero | Spec y plan viven en `.ai/specs/001-…`; `progress.md` se actualiza al cerrar el turno |
| 2 · Verificar antes de terminar | `.cursor/verify.json` pasa a ejecutar typecheck, lint, test y build en Docker |
| 3 · Pasos pequeños y reversibles | Fase 1 acotada; `/tasks` la parte en tareas testeables de forma independiente |
| 4 · Simplicidad | Sin UI kit, sin CMS, sin MSW, sin librería de formularios. Una sola dependencia de estado |
| 5 · Trazabilidad | Cada elección de la §2 traza a un requisito; las no obvias tienen ADR |
| 6 · Seguridad | Sin secretos en el repo; `.env.example` versionado, `.env` no; entorno validado con Zod |
| 7 · Consistencia | Se respeta la convención Docker ya registrada en `.ai/architecture.md` |

## 12 · Siguiente paso

`/tasks` — convertir este plan en un checklist ordenado. Orden previsto: entorno Docker → tokens y
fuentes → primitivas del §03 → layout (header, búsqueda, footer, FAB) → catálogo y filtros →
ficha → carrito y drawer → i18n completo → suite E2E y accesibilidad → gate de verificación.
