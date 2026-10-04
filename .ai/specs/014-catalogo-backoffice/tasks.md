# Tasks · 014 Catálogo del backoffice

- **Estado:** cerrada (T332–T339)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0019](../../decisions/0019-catalogo-backoffice-proxy-y-campos.md)

No se toca `web/` ni `api/`. No hay dependencia nueva. El navegador no
llama a `api`. Cada tarea de comportamiento se escribe en rojo y
después el mínimo de código que la pone verde. Vitest corre en Docker
con `--no-deps`.

## Setup

- [x] **T332 · Contrato y etiquetas** `[P]` → AC-2, etiquetas de visibilidad
  Puede ir en paralelo con T333 y T338.
  `backoffice/src/lib/catalog/contract.ts`: Zod de producto, categoría
  y tag, como los devuelve 013. Un campo de más no entra.
  `backoffice/src/lib/catalog/labels.ts`: Publicado / Borrador / No
  listado, Digital / Físico, precio `es-AR` en ARS, `1 foto` / `3 fotos`.
  Test primero en `backoffice/src/lib/catalog/__tests__/contract.test.ts`
  y `labels.test.ts`.

## Foundational

- [x] **T333 · Validación del alta** → US-3, AC-3, AC-4
  Depende de nada de red. Puede ir con T332.
  `backoffice/src/lib/catalog/form.ts`. Pura: no llama a `fetch`.
  Obligatorios vacíos nombran el campo. Foto de más de 5 MB, un noveno
  archivo o un tipo que no es JPEG, PNG ni WebP devuelven el texto de
  013. Un decimal opcional mal escrito no pasa. Los vacíos no salen en
  el cuerpo. El descuento, si viene, es un entero.
  Test primero en `backoffice/src/lib/catalog/__tests__/form.test.ts`.

- [x] **T334 · Cliente HTTP** → US-4, AC-5, AC-7, RNF-1, RNF-2
  Depende de T332.
  `backoffice/src/lib/catalog/client.ts`: `createCatalogClient(baseUrl, fetch)`.
  Bearer en `Authorization`. Alta de producto en multipart con los
  nombres de 013. `detail` texto se conserva. Una lista de validación
  se aplana a «Faltan datos o no son válidos.» Red caída: frase
  genérica, sin tirar.
  Test de integración en
  `backoffice/src/lib/catalog/__tests__/client.integration.test.ts`
  (`@vitest-environment node`): `http.Server` en loopback. Exige el
  bearer, lee el multipart (campos obligatorios y el archivo), el `GET`
  devuelve el producto creado en esa corrida, y un alta sin `name`
  se lee como 422. No abre AWS ni la base `sparks`.
  El caso de `detail` texto y el de la lista, con `fetch` falso, en
  `client.test.ts`.

- [x] **T335 · Proxy del panel** `[P]` → AC-8, RNF-1
  Puede ir con T333. No lo importa ningún componente de cliente.
  `backoffice/src/lib/catalog/proxy.ts` y tres route handlers:
  `backoffice/src/app/api/catalog/products/route.ts`,
  `product-categories/route.ts`, `tags/route.ts`.
  Sin `Authorization`, 401 y no llama. Con bearer, reenvía `GET` y
  `POST` a `API_BASE_URL` más la ruta fija, y copia status y cuerpo.
  Una ruta fuera de esas tres responde 404 y no llama. No hay
  `[...path]`.
  Test primero en `backoffice/src/lib/catalog/__tests__/proxy.test.ts`,
  con `fetch` inyectado. Otro assert lista el directorio
  `src/app/api/catalog` y exige sólo esas tres carpetas.

## US-1 · Listado

- [x] **T336 · Tabla de productos** → US-1, AC-1, AC-2, AC-6
  Depende de T332 y T334.
  `backoffice/src/components/catalog/catalog-list.tsx`.
  `backoffice/src/app/(panel)/catalogo/page.tsx` monta el listado y
  deja de ser sólo el título.
  Vacío: «Todavía no hay productos.» Sin nombres de la maqueta.
  Fila: nombre, marca o `—`, nombre de categoría (uuid si no está),
  precio, etiqueta de visibilidad, cantidad de fotos. Con 50 filas, la
  línea de los 50 más nuevos. Un `detail` de la API se muestra.
  Enlace «Nuevo producto» a `/catalogo/nuevo`.
  Sacar `CatalogoPage` de la lista «sin tabla» en
  `backoffice/src/components/shell/__tests__/section-title.test.tsx`.
  Test primero en
  `backoffice/src/components/catalog/__tests__/catalog-list.test.tsx`.

## US-2 · US-3 · US-4 · US-5 · Alta

- [x] **T337 · Formulario** → US-2, US-3, US-4, US-5, AC-3, AC-5, AC-6
  Depende de T333, T334 y T336.
  `backoffice/src/components/catalog/product-form.tsx` y
  `backoffice/src/app/(panel)/catalogo/nuevo/page.tsx`.
  Un control por campo de 013. Tipo, visibilidad y categoría arrancan
  sin valor elegido. El descuento dice que se guarda y no cambia el
  precio.
  Guardar corre `form.ts` antes. Si falta algo, no llama a
  `createProduct`. Un 422 muestra el `detail` y no navega. Un alta
  buena hace `router.push("/catalogo")`.
  «Crear categoría» y «Crear tag» en la misma página. Si fallan, el
  nombre del producto que ya estaba escrito sigue ahí. Si salen bien,
  la categoría queda elegida y el tag queda marcado.
  Test primero en
  `backoffice/src/components/catalog/__tests__/product-form.test.tsx`.

## Polish

- [x] **T338 · Menú** `[P]` → AC-9
  Puede ir desde el principio.
  `backoffice/src/content/nav.ts`: Catálogo sin `count`.
  `crumbFor("/catalogo/nuevo")` sigue diciendo Catálogo.
  `backoffice/src/components/shell/__tests__/shell.test.tsx` y
  `backoffice/src/content/__tests__/panel.test.ts`: Pedidos sigue en
  `2`; Catálogo ya no exige `5`.

- [x] **T339 · Verify y handoff** → RNF-3, AC-10
  Depende de T332–T338.
  `docker compose -f docker/docker-compose.yml run --rm --no-deps backoffice npm run verify`
  Typecheck, lint, Vitest y build. Arreglar la causa. Tildar esta
  lista. `plan.md` pasa a implementado. `architecture.md`, el glosario,
  `project.md` y `progress.md` dicen que `/catalogo` ya lista y crea.
  `web/` y `api/` sin cambios. `verify.json` no gana un check.

## Dependencias

```
T332 [P] ──→ T334 ──→ T336 (US-1) ──→ T337 (US-2…US-5) ──→ T339
T333 [P] ─────────────────────────→ T337
T335 [P] ───────────────────────────────────────────────→ T339
T338 [P] ───────────────────────────────────────────────→ T339
```

## Definition of Done

- T332–T339 tildadas.
- AC-1…AC-9 cubiertos por Vitest dentro del contenedor `backoffice`,
  sin Postgres y sin AWS. El 422 real de FastAPI sigue en el pytest de
  013.
- `npm run verify` del backoffice en verde (`--no-deps`).
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- `web/` y `api/` sin cambios.
