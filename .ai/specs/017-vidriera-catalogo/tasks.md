# Tasks · 017 La vidriera lee el catálogo

- **Estado:** cerrada (T351–T358)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0024](../../decisions/0024-lectura-publica-y-filtros.md)

Pytest de la API usa Postgres de test. Vitest de `web` y del backoffice
corren con `--no-deps`. Cada tarea de comportamiento se escribe en rojo
y después el mínimo de código que la pone verde.

## Foundational

- [x] **T351 · Columnas** → AC-6
  `api/alembic/versions/0004_product_facets.py` y
  `api/app/models/catalog.py`. `family` (varchar 40, null) y
  `size_ml` (entero, null, check `> 0`). `CREATE EXTENSION unaccent`.
  `api/app/schemas/catalog.py`: los dos campos en `ProductPublic` y
  `ProductInput`. Slug fuera de los cuatro, o `size_ml` que no sea
  entero positivo, no valida. Omitidos quedan null.
  Pytest: un alta sin esos campos sigue en 201 con null. Un slug
  ajeno y `size_ml=0` responden 422.

- [x] **T352 · Lectura pública** → AC-1, AC-2, AC-3, AC-8
  Depende de T351.
  `api/app/audit.py`: `public=True` no inserta y no responde 401 si
  no hay actor.
  `api/app/api/deps.py`: sin bearer, lector null; bearer inválido,
  401; clave sin cambiar, 403.
  `api/app/api/routes/products.py`: `GET /products` y
  `GET /products/{id}` usan ese lector. Sin actor, sólo `visible` y
  `ProductStore` (sin costo, sku, código, descuento ni medidas). Un
  id que no es visible es 404. Con actor, `ProductPublic` y las tres
  visibilidades. `POST` y `PATCH` siguen con sesión.
  `api/tests/e2e/test_openapi.py`: esos GET no exigen security.
  Pytest primero: anónimo, oculto, bearer de operador, auditoría.

- [x] **T353 · Filtros y orden** → AC-4, AC-5
  Depende de T352.
  El mismo GET acepta `family`, `brand`, `size`, `priceMin`,
  `priceMax`, `q`, `sort` y el `limit` de 013. Unión dentro de la
  faceta, intersección entre facetas, precio inclusivo sobre
  `price`. `q` es subcadena del nombre, sin mayúsculas ni acentos,
  con `%` y `_` escapados. `sort` ausente o desconocido: nombre A–Z
  y `id`. `name-desc`, `price-asc`, `price-desc` como la spec.
  `GET /products/facets` antes de `/{id}`: cuenta sólo visibles.
  Pytest primero: el query combinado, `jazmin` contra «Jazmín», el
  desempate por `id`.

## US-4 · Panel

- [x] **T354 · Familia y tamaño en el panel** `[P]` → AC-6
  Puede ir junto con T353. El cliente se prueba con fetch falso.
  `backoffice/src/lib/catalog/families.ts`: los cuatro slugs.
  `contract.ts`: `family` y `size_ml` anulables.
  `form.ts` y `client.ts`: el alta los manda. Vacío es «Tamaño» o
  «Familia» y no llama al cliente.
  `product-form.tsx`: select y mililitros, con `name`. Sale
  «Fresco & acuático». Para sigue sin `name`.
  `catalog-list.tsx`: las celdas muestran la etiqueta y `{n} ml`,
  o una raya si son null.
  Tests en `form.test.ts`, `contract.test.ts`, `product-form.test.tsx`
  y `catalog-list.test.tsx`. Los fixtures de `Product` ganan las claves.

## US-1 · US-2 · US-3 · Vidriera

- [x] **T355 · Contrato y orden** → AC-4, AC-7
  Depende de nada del API. Puede ir con T351.
  `web/src/lib/api/contract.ts`: `name-desc`, default `name-asc`.
  Sale `relevance`. Notas que pueden ir vacías, `stock` y `size`
  anulables, `brand` y `concentration` que pueden ir vacíos.
  `search-params.ts` y `sort-select.tsx`. Copia `sortNameDesc` en
  `es.json` y `en.json`.
  `mock-repository.ts`: el default ordena por nombre. `search` de
  fixtures no cambia.
  Tests de `search-params` y del mock que asumían `relevance`.

- [x] **T356 · Repositorio HTTP** → AC-1, AC-4, AC-7
  Depende de T355.
  `web/src/lib/api/http-repository.ts` pide `/products` con
  `toSearchParams` y `limit=100`, `/products/{id}` y
  `/products/facets`. Mapea al contrato: slug = id, notas vacías,
  stock null, precio en pesos enteros, packshot = `photo_urls[0]`.
  No filtra en proceso. `getRelated` devuelve `[]`. `search` usa `q`.
  `contract.test.ts`: el suite de fixtures queda en el mock. El HTTP
  afirma la query y el mapeo contra un cable `ProductStore`. No se
  baja la aserción de «vainilla» del mock.

- [x] **T357 · Tarjeta, ficha y modo http** → AC-7
  Depende de T355.
  `product-card.tsx`: sin párrafo de notas si están vacías; sin
  «Agotado» si `stock` es null; la línea mono omite marca o tamaño
  vacíos.
  `olfactive-pyramid.tsx`: no se monta si las tres listas están vacías.
  `purchase-block.tsx`, `spec-table.tsx`, la ficha, el carrito y la
  home toleran stock y tamaño null sin tratar null como agotado.
  `docker/docker-compose.yml`: el servicio `web` del stack usa
  `API_MODE=http`. `web/docker-compose.yml` sigue en `mock`.
  Test de la tarjeta y de la pirámide.

## Polish

- [x] **T358 · Verify y handoff**
  Depende de T351–T357.
  Pytest del API, `npm run verify` de `web` y del backoffice, ruff.
  Arreglar la causa. Tildar esta lista. `plan.md` pasa a implementado.
  `architecture.md` y `progress.md` dicen que `/catalogo` en `http`
  lee el GET público.

## Dependencias

```
T351 ──→ T352 ──→ T353 ──┐
T354 [P] ────────────────┼──→ T358
T355 ──→ T356 ───────────┤
       └─→ T357 ─────────┘
```

## Definition of Done

- T351–T358 tildadas.
- AC-1…AC-8 cubiertos por pytest y por Vitest (`web` y backoffice,
  `--no-deps`).
- `/verify` en verde: pytest del API, ruff, y los cuatro checks de
  `web` y del backoffice.
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- El bearer no va en la query ni en una cookie. `POST` y `PATCH`
  siguen exigiendo sesión.
