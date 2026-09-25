# Lessons

Gotchas no obvios que costaron tiempo. Concretos y accionables.

## API

### Alembic desde pytest no puede usar `asyncio.run` en el mismo loop

`alembic/env.py` llama a `asyncio.run`. Si un fixture async de pytest-asyncio
hace `command.upgrade` en el mismo proceso, falla con «this event loop is
already running». `tests/conftest.py` lanza `alembic upgrade head` en un
subproceso, con `ALEMBIC_DATABASE_URL` apuntando a `sparks_test`.

### El engine de la app no puede reusar conexiones entre tests

pytest-asyncio abre un event loop por test. El pool de `app.db.engine`
guarda conexiones de asyncpg atadas al loop anterior y el siguiente request
revienta con «Future attached to a different loop». En e2e,
`_point_app_at_test_database()` sustituye ese engine por uno a
`sparks_test` con `NullPool`, así cada request abre la conexión en el loop
del test.

## Docker

### El healthcheck de Next debe usar `127.0.0.1`, no `localhost`

`next dev -H 0.0.0.0` escucha **sólo en IPv4**. Dentro del contenedor `localhost` resuelve primero
a `::1`, así que `wget --spider http://localhost:3000` devolvía «connection refused» de forma
indefinida, el contenedor quedaba `unhealthy` y el servicio `e2e` abortaba con
«dependency failed to start».

El síntoma engaña: los logs de Next dicen `✓ Ready` y `Network: http://0.0.0.0:3000`, así que
parece un problema de arranque cuando en realidad es de resolución de nombres.

Regla: en healthchecks de contenedor, siempre `127.0.0.1`.

### El puerto 3000 del host suele estar ocupado

Otros proyectos en la misma máquina se lo quedan. Por eso el mapeo es `${WEB_PORT:-3000}:3000` y
hay `docker/.env.example`. En la máquina de Nico, `WEB_PORT=3100` (el 3000 lo tiene `ads-cloud-web`).

## Tooling

### Next 16 necesita `next typegen` antes de `tsc --noEmit`

El layout que genera `create-next-app` usa el tipo global `LayoutProps`, que Next produce en
`.next/types` durante `dev` o `build`. Un `tsc --noEmit` en frío —clon limpio, CI— falla con
`Cannot find name 'LayoutProps'`. Por eso el script es `next typegen && tsc --noEmit`.

### `vitest-axe` está muerto y rompe con Vitest 5

La versión 0.1.0 (2022) declara sus matchers aumentando el namespace global `Vi`, convención que
Vitest 5 ya no lee: `Property 'toHaveNoViolations' does not exist`. Mantenerlo obligaba a versionar
un shim de tipos para un paquete sin mantenimiento, con seis dependencias transitivas detrás.

Se usa `axe-core` directamente desde `web/src/test/a11y.ts`. Ver ADR-0005.

Lección general: cuando un wrapper de testing falla sólo en los tipos, mirar la fecha de su último
release antes de escribir el shim.

### `@types/node` debe seguir al runtime, no al andamiaje

`create-next-app` fija `@types/node@^20`, pero la imagen es Node 22 y Vitest 5 pide
`^22 || >=24`. El resultado es un `ERESOLVE` que invita a usar `--legacy-peer-deps`. La causa real
era la versión equivocada: subirla a `^22` resuelve el conflicto sin forzar nada.

## Tipografía y tokens

### El presupuesto de fuentes se mide por subset, no por carpeta

`du -sh .next/static/media` daba 369KB contra un objetivo de 180KB, lo que parecía un
incumplimiento grave. No lo era: `next/font` descarga **todos** los subsets que Google publica
(griego, cirílico, vietnamita) y genera un `@font-face` con su `unicode-range` para cada uno. Un
lector en español o inglés sólo baja el subset latino. La cifra real es 120KB.

Esto dejó de aplicar con ADR-0006: ahora se envía un archivo por cara, subset latino, versionado,
y `npm run font-budget` sólo mide `src/styles/fonts/` sin construir nada. Se conserva la anécdota
porque explica por qué una cifra de `du -sh` sobre la salida de un build **no** es el presupuesto.

### Prettier pasa los hex de CSS a minúscula

El PDF escribe los colores en mayúscula y `theme.css` también, hasta que corre `npm run format`.
Los tests de tokens comparan sin distinguir mayúsculas: la caja de un hex no significa nada y no
vale la pena excluir el archivo del formateador por eso.

### `next/font/google` hacía que el build fallara de forma intermitente — resuelto

Descargaba las fuentes **en cada build**. Uno falló con veinte errores
`Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'` y
`next/font/google queries have exactly one entry`; el siguiente, sin cambiar nada, pasó.

Resuelto en ADR-0006: los `.woff2` están versionados y se usa `next/font/local`. Si vuelve a
aparecer un error de red en un build, lo primero es buscar qué lo reintrodujo.

Dos cosas que costó descubrir al migrar:

- La API de Google Fonts devuelve la **TTF completa** si se pide con un user agent antiguo
  (`Mozilla/4.0`); con uno moderno devuelve woff2 ya troceados por subset. Eso permite recortar un
  único archivo por cara con `pyftsubset` en vez de tener que unir los trozos de Google.
- `next/font/local` **no admite `unicode-range` por archivo**: `src` sólo acepta `path`, `weight` y
  `style`. Dos archivos de la misma familia, peso y estilo colisionan, así que no se pueden servir
  latin y latin-ext como ficheros separados de una misma familia.

Para comprobar que un build ya no depende de la red:

```powershell
docker run --rm --network none -v D:/projects/sparks/web:/app -v /app/node_modules -v /app/.next -w /app sparks-web:latest npm run build
```

## i18n

### Un `loading.tsx` padre se come el `notFound()` de la ficha

`catalogo/loading.tsx` envuelve también `/catalogo/[slug]`. Si la ficha llama
`notFound()`, Next hace stream del skeleton y el fallback de 404 falla en el
cliente (0 `<h1>`). El listado vive en `catalogo/(grid)/` para que su loading
no cubra la ficha. La ficha **no** tiene `loading.tsx`: el `notFound()` tiene
que ganar al stream. Tiene su propio `not-found.tsx`.

### El layout raíz vive dentro de `[locale]`

Con `next-intl` y prefijo de ruta, `app/[locale]/layout.tsx` **es** el layout raíz y no existe
`app/layout.tsx`. Consecuencia poco obvia: un `notFound()` no tiene dónde renderizarse para rutas
que no matchean, así que hace falta `app/[locale]/[...rest]/page.tsx` que llame a `notFound()`.

Next 16 además deprecó `middleware.ts`; el archivo se llama `proxy.ts` (mismo contenido y misma
firma).

### `no-literal-string` en modo `jsx-text-only` no mira los atributos

Deja pasar `alt="Frasco"` y `aria-label="Cerrar"`, que es justo el texto que AC-20 vigila. El modo
correcto es `jsx-only` con `jsx-attributes.include` acotado a los atributos visibles; sin esa
lista, `jsx-only` marcaría también `className` e `id`.

Al configurar una regla de lint, comprobar que **dispara** con un componente sonda. Que el lint
pase no prueba que la regla esté activa.

### `router.replace(pathname)` no acepta rutas dinámicas tipadas

`usePathname()` de next-intl devuelve el *nombre* de la ruta (`/catalogo/[slug]`), no la URL
llena. `router.replace(pathname, { locale })` no typechequea y, peor, perdería el slug. El patrón
documentado es `{ pathname, params }` con `useParams()` de `next/navigation`. Hay que castear:
los tipos de `replace` no admiten esa unión. Comprobado en el navegador:
`/en/catalogue` → `/es/catalogo`.

### `useSearchParams` en el chrome rompe el prerender de toda página

El header vive en el layout de `[locale]`. Si el selector de idioma lee
`useSearchParams()`, Next exige un `<Suspense>` alrededor y, sin él, `next build` falla en `/es`
con `missing-suspense-with-csr-bailout`. El query de filtros se lee en el *click* desde
`window.location.search`, que es el momento en que hace falta y no contamina el prerender.

### Cambiar filtros no puede ir por `router.replace`

`router.replace('/es/catalogo?x=1')` y `router.replace('?x=1')` (next/navigation y next-intl)
dejan la URL en `/es/catalogo` sin query: el proxy trata el pathname como invariable.

Los chips son `Link` de next-intl con `{ pathname: "/catalogo", query }` — el mismo patrón
que las familias de la home, y el que sí escribe el search string. Un `onClick` +
`location.assign` no basta: en Playwright esos botones no hidratan y el click no hace nada.
El select de orden sí usa `location.assign` (no puede ser un enlace). Ver ADR-0007.

## E2E

### Playwright contra `http://web:3000` no hidrata sin `allowedDevOrigins`

Next 16 + Turbopack corta el WebSocket de HMR si el `Host` no es un origen de
desarrollo conocido. El E2E ve HTML del servidor, `__reactFiber` no aparece y
cualquier `onClick` es un no-op. Los `Link` siguen funcionando (navegación real),
por eso el catálogo pasaba y el carrito no.

Regla: `allowedDevOrigins` incluye `web` (ADR-0008). Antes de un click cliente,
esperar `#header-cart[data-hydrated=true]`.

### El contenedor `web` ya levantado sirve chrome viejo

Añadir un archivo nuevo (`SearchOverlay`, un `id` en el header) y correr E2E contra un
`sparks-web-1` que ya estaba `healthy` falla como si el click no hidratara: el snapshot
muestra `aria-expanded` (el store del header viejo sí abre) pero no el dialog, o
`#header-search` no existe. El bind mount actualiza el fuente; Turbopack no siempre
recompila el layout.

Regla: después de islas nuevas en el layout, `docker compose … restart web` y esperar
`healthy` antes del E2E.

Con hidratación, un `Link` de next-intl hace navegación cliente y los chips del
catálogo se quedan con el `query` del RSC anterior: el segundo filtro pisa al
primero. Los chips son `<a href>` nativos (`catalogUrl`) para recargar.

### `title.template` con `{page}` tumba `generateMetadata`

Next interpola `metadata.title.template` con `%s`. Pasarle el `{page}` de next-intl
lanza `FORMATTING_ERROR` / `Missing metadata.titleTemplate` y la página se sirve
como `__next_error__` (html sin `lang` ni title). Axe entonces marca
`document-title` y `html-has-lang` en *todas* las rutas. El layout usa
`title: t("title")` plano; las páginas pasan su propio title por `seoMetadata()`.

### El skip-link no entra en touch ni overflow

`.sr-only` está recortado a 1×1. Si el E2E de AC-15 / AC-17 lo mide, falla.
Excluir `.sr-only` (y `[aria-hidden='true']`) de esas mediciones.

### `prefers-reduced-motion` deja `animationName` vacío, no `"none"`

`page.emulateMedia({ reducedMotion: "reduce" })` en Chromium para la marquesina:
`getComputedStyle().animationName` es `""` y `transform` es `none`. Aceptar
ambos; no exigir el literal `"none"` en `animationName`.

### Kickers oro a 10px (ADR-0009)

24px en TIENDA / Envíos / Sparks Club / 01–04 los convierte en títulos.
El proto es 10px `#8A6B32`. Sobre canvas Chrome marca 4.4:1 (aviso). Sobre
ink, un oro más claro (`oklch(0.72 0.09 85)`) llega a 7.5:1. No subir el
kicker a 24px para “arreglar” el aviso.

### Contraste: `text-ink/55` a 22px no pasa AA

El proto pinta la marquesina `rgba(20,16,14,0.55)` sobre `#FBF9F5`. Axe mide
4.11:1 (hace falta 4.5:1; 22px regular no es «large text»). Usar
`text-text-muted` (`#3E3731`). No relajar el E2E de axe.

### Contraste: `canvas/40` y `text-success` fallan a 10px

`#4CA455` sobre canvas es 2.76:1; `text-canvas/40` sobre ink es 3.52:1. Axe
`color-contrast` los marca en el footer y en el badge de stock. Usar
`text-canvas/70` y `text-ink` para copy pequeña; el verde success queda para
el punto no-texto del FAB.

### Miniaturas y enlaces subrayados miden el glifo, no el hit area

Una miniatura cuyo `<button>` envuelve un placeholder sin `block w-full` sale
2×2px. Un `Link` subrayado de `text-label` sin `inline-flex min-h-11 items-center`
sale ~10px de alto (el vacío del carrito «Ver catálogo»). AC-15 exige las dos
clases en todo control que no sea un botón del §03.

«TikTok» a `text-mono-meta` mide 38×44: `min-h-11` no basta. Labels cortos
de redes llevan también `min-w-11`.

### `getByRole('heading', { name })` es substring

«Todo el país» matchea el h2 de Services («Envíos a todo el país») **y** el
de la franja 002. Usar `{ exact: true }` cuando dos headings comparten un
trozo.

## Estado

### `persist` de Zustand escribe en cada `setState`

Un test que hacía `setState({items: []})` para «simular una recarga» borraba `localStorage` antes
de rehidratar, y la rehidratación devolvía vacío. Para probar la hidratación hay que **sembrar el
almacenamiento después** de vaciar el store, no antes.

En la aplicación se usa `skipHydration: true` y un `rehydrateCart()` en efecto: hidratar durante
el render haría que el contador del header renderizado en servidor (siempre vacío) no coincida
con el del cliente.

## PowerShell

Encadenar `sh -c "... $(comando) ..."` en un `docker run` no funciona: PowerShell interpola `$(...)`
antes de pasarlo al contenedor. Usar comillas simples, o —mejor— dejar que la herramienta resuelva
el trabajo (por ejemplo `npm install --package-lock-only`, que además evita inventar versiones a
mano).

Además, PowerShell trata la salida por stderr de `docker compose` como error cuando se usa `2>&1 |`,
así que un `$LASTEXITCODE`/`Exit code` distinto de 0 en esos pipelines **no** significa que el
comando fallara. Comprobar la salida real antes de concluir nada.
