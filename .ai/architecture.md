# Architecture

## Overview

Un storefront de Next.js (`web/`). La cuenta (spec 008) llama a `api/`
desde server actions: login, registro, `/me` y logout. El bearer queda en
la cookie httpOnly `sparks_session`. El catálogo sigue contra el
contrato de `web/src/lib/api/contract.ts` y, con `API_MODE=mock`, en fixtures.
La apuesta central no cambia: el frontend se construye **contra un contrato, no contra un backend**, de modo
que conectar el catálogo a `api/` no reescriba componentes.

## Components / boundaries

| Capa | Dónde | Responsabilidad |
|------|-------|-----------------|
| Tokens de diseño | `web/src/styles/theme.css` | Única fuente de colores, tipografía, espaciado y breakpoints. La paleta y los radios de Tailwind están **reemplazados**, no extendidos |
| Contrato de datos | `web/src/lib/api/contract.ts` | Esquemas Zod de los que se **infieren** los tipos. Es lo que `api/` deberá cumplir |
| Repositorio | `web/src/lib/api/` | `CatalogRepository` con dos implementaciones: `mock-repository` (fixtures) y `http-repository` (valida cada respuesta contra el contrato). `API_MODE` elige |
| Estado | `web/src/lib/cart/`, `web/src/lib/ui/` | Carrito persistido (sólo referencias) y overlays. Zustand |
| i18n | `web/src/i18n/`, `web/src/proxy.ts` | Locales, rutas traducidas, diccionarios |
| UI | `web/src/components/`, `web/src/app/[locale]/` | Nunca llaman a `fetch` ni importan fixtures: pasan por el repositorio |
| Chrome | `web/src/components/layout/` + `search/` | Header, barra de anuncio, menú móvil, footer, FAB, hidratación del carrito, drawer, overlay de búsqueda y toasts. El layout de `[locale]` los monta una vez |
| SEO | `web/src/lib/seo.ts` + `web/public/` | `hreflang` es-AR / en / x-default, Open Graph 1200×630, favicon SVG + PNG 32/180/512 |

La frontera dura está en el repositorio. Un componente que llame a `fetch` o lea `src/fixtures`
directamente rompe la posibilidad de cambiar de backend sin tocar la UI (ADR-0003).

## Docker convention

Every microservice folder has the **same** layout:

```
<service>/
├── Dockerfile
├── docker-compose.yml   # runs this service alone
├── .dockerignore
└── .env.example
```

The `docker/` folder only orchestrates the full stack. It references each service `Dockerfile` [] — never duplicates Dockerfiles.

## Domain resources (selected)

- **Product** — marca, nombre, familia olfativa, concentración, tamaño, precio en ARS entero,
  pirámide de notas (salida/corazón/fondo), stock, imágenes. Marca y nombre son nombres propios y
  no se traducen; familia y concentración viajan como slug y se traducen en el diccionario.
- **Facets** — valores disponibles de familia, marca y tamaño con su recuento, más el rango de
  precios. Alimentan la barra lateral del catálogo.
- **CartItem** — `{productId, slug, quantity}`. Es lo único que se guarda; el precio se recalcula
  siempre desde el repositorio.

## Key flows

### Petición de página

`proxy.ts` negocia el locale y redirige `/` al prefijo que corresponda → el layout de
`[locale]` fija el locale de la petición y carga el diccionario → la página pide datos al
repositorio → `API_MODE` decide si salen de fixtures o de `api/`.

### Catálogo

Los filtros viven en la URL (`family`, `brand`, `size`, `priceMin`, `priceMax`, `q`, `sort`).
La página RSC los parsea con `fromSearchValues` y pide `listProducts` + `getFacets`. Cada chip
es un `Link` al query siguiente — `router.replace` descarta el search en este pathname
(ADR-0007). Una combinación que vaciaría la grilla se atenúa al 40% y no es enlace.

### Ficha

`/catalogo/[slug]` pide `getProduct` + `getRelated`. Galería y compra son cliente (miniaturas,
stepper); el resto es RSC. El listado vive en `catalogo/(grid)/` para que su `loading.tsx` no
envuelva la ficha.

### Carrito

Agregar (`useAddToCart`) guarda una referencia, abre el overlay `cart` y encola un toast.
`resolveCart()` une esas referencias con el producto vivo en el cliente (`useResolvedCart`):
recalcula precios, recorta cantidades al stock y reporta lo agotado. El drawer
(`cart-drawer.tsx`, 420px, z-101) y `/carrito` (`CartView` + `CartAside`) leen el
mismo store; el contador del header espera `hydrated` para no desajustar el HTML
del servidor. La página (005) pinta el aside del prototipo; el drawer conserva
el resumen compacto. El `wa.me` de pedido no se arma bajo $30.000.

### Hero y home (003 / 006)

Orden: Hero → marquesina → familias → destacados → Club → `commerce-strip`
(Envíos / Pagos / Mayorista). **Sin** el bloque T054.

Copy del hero a la izquierda (`GoldRule` 34×1 + h1 con `titleEm` oro +
CTAs + stats). Figure a la derecha con `Packshot fill`, pegada a la
marquesina (Cormorant 22px, `text-text-muted`). Familias: desc + count,
min-h 250, hover ink. Destacados: «Los más pedidos» + «Ver todo».

Club: h2 34→56, kicker e índices oro **10px** (`GOLD_KICKER` / `GOLD_INDEX`,
ADR-0009). Misma escala en commerce-strip, footer y contacto. El h1
«Se recuerda.» sigue oro grande.
Redes del prototipo (`sparks.insumos`). FAB con `border-canvas/20`.

### Búsqueda

El trigger (`#header-search`) abre el overlay `search`. Backdrop `rgba(20,16,14,0.55)` + blur,
foco al input, Escape / backdrop / close restauran el trigger (AC-12). Chips de nota y marca
salen de `getFacets` + `listProducts`. Desde 2 caracteres se muestran hasta 4 resultados.
Enter hace `location.assign` a `/es/catalogo?q=` · `/en/catalogue?q=` (ADR-0008).

### SEO

`seoMetadata()` en `web/src/lib/seo.ts` arma title, description, canonical y
`alternates.languages` (`es-AR`, `en`, `x-default` → es). El layout fija `metadataBase`
(`NEXT_PUBLIC_SITE_URL` o `http://localhost:3000`) y los iconos. OG usa `/og.png` (1200×630).
Las marcas las genera `web/scripts/write-brand-images.mjs`; un test comprueba los tamaños PNG.

`title` de Next es un string plano. **No** usar `title.template` con el placeholder `{page}`
de next-intl — Next exige `%s` y un template mal formado tira `generateMetadata`.

### Contacto (004)

`/contacto` · `/contact` reclama la ruta que el chrome ya enlazaba. Página
cliente (`contact-page.tsx`) + isla de formulario que solo hace
`preventDefault`. Aside con WhatsApp / email del proto / Franklin y panel
ink a `wa.me` (`whatsapp.general`). Sin POST ni toast. Kicker oro ≥24px
(RNF-2).

### Cierre de compra

No hay pasarela de pago en Fase 1. El carrito se convierte en un mensaje de WhatsApp
(`buildWhatsappUrl`) con el pedido precargado; el texto sale del diccionario para que se traduzca.

### Cuentas (007)

Implementada en [`specs/007-api-autenticacion/`](specs/007-api-autenticacion/spec.md).
Servicios `db` y `api` en Compose (`web` no depende de ellos). Bases `sparks`
y `sparks_test`. `GET /health` sigue para el healthcheck.

- FastAPI + SQLAlchemy async + Postgres, en contenedores `api` y `db`.
  `web` no depende de ellos.
- Bearer opaco guardado hasheado en `sessions`. Logout revoca la fila.
- `DELETE /me` pone `users.active = false`. No borra la fila.
- `must_change_password`: el login entrega token, y cualquier otra ruta
  autenticada responde 403 `password_change_required` hasta
  `POST /auth/change-password`. El usuario base nace con el flag en true.
- Swagger en `/docs`.
- El storefront llama a esas rutas desde server actions (`web/src/lib/auth/`).
  `API_MODE` no gobierna la cuenta: siempre usa `API_BASE_URL`. El catálogo
  sigue en fixtures. El layout no lee cookies; el enlace «Mi cuenta» mira
  `sparks_signed_in` después de montar.
- La página de cuenta ([009](specs/009-cuenta-fidelidad/spec.md), ADR-0013)
  dibuja Nivel, Cupón activo y Pedidos con `-`, y «Tus pedidos» vacío.
  `GET /me` no trae esos datos. No se inventan.

### Standalone
<!-- The concrete pain and the "job" the customer hires the product to do. -->
- _TBD_

### Full stack
<!-- The concrete pain and the "job" the customer hires the product to do. -->
- _TBD_

### PRE frontend deploy
<!-- The concrete pain and the "job" the customer hires the product to do. -->
- _TBD_

## External dependencies

En tiempo de build: **ninguna**. Las tipografías están versionadas (ADR-0006) y el build pasa con
`--network none`.

En tiempo de ejecución:

- **wa.me** — el checkout termina en WhatsApp. Sin SDK: sólo un enlace.
- **`api/`** — cuentas y sesión. El storefront las usa para ingresar, registrarse
  y la página de cuenta. El catálogo no: con `API_MODE=mock` los productos
  salen de fixtures.

No hay pasarela de pago, analítica ni CMS en Fase 1.

A demanda, fuera de cualquier build: **Google Fonts**, a través de la etapa `fonts` del Dockerfile
de `web/`, para regenerar los `.woff2`.
