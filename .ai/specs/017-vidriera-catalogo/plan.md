# Plan técnico · 017 La vidriera lee el catálogo

- **Estado:** implementado
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0024](../../decisions/0024-lectura-publica-y-filtros.md).
  Acota [0019](../../decisions/0019-catalogo-backoffice-proxy-y-campos.md)
  en familia y tamaño, y el formato de cable de
  [0003](../../decisions/0003-capa-de-datos-desacoplada.md).
  Los chips siguen en la URL
  ([0007](../../decisions/0007-filtros-del-catalogo-como-enlaces.md)).

## 1 · Enfoque

Cuatro capas, en este orden.

La tabla gana `family` y `size_ml`. Sin eso el GET no puede filtrar
lo que la URL ya manda.

`GET /products` y `GET /products/{id}` dejan de exigir sesión. Sin
bearer filtran `visible` y arman un cuerpo público. Con bearer
siguen el `ProductPublic` de 013. Los query de 017 se aplican en
SQLAlchemy en los dos casos. `POST` y `PATCH` no se tocan en la
guarda.

`web/` en `API_MODE=http` pide ese GET con los mismos nombres que
`toSearchParams` (`family`, `brand`, `size`, `priceMin`, `priceMax`,
`q`, `sort`) y mapea la respuesta al contrato. La grilla no llama a
`productMatchesQuery`. `API_MODE=mock` queda para los tests y para
`up web` sin API.

El panel manda `family` y `size_ml` en el alta y en la edición, y
las dos columnas dejan de pintar una raya fija.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `api/alembic/versions/0004_product_facets.py` | `family` (varchar 40, null) y `size_ml` (integer, null). Check: `size_ml > 0` |
| `api/app/models/catalog.py` | Esas dos columnas |
| `api/app/schemas/catalog.py` | En `ProductPublic`. Un `ProductStore` sin costo, sku, código, descuento ni medidas |
| `api/app/api/routes/products.py` | Query, orden, lectura anónima, `public=True` |
| `api/app/audit.py` | `public=True`: sin actor no inserta y no es 401 |
| `api/tests/e2e/test_catalog.py` | AC-1…AC-5 y AC-8 del lado API |
| `backoffice/src/lib/catalog/contract.ts` | `family` y `size_ml` anulables |
| `backoffice/src/components/catalog/product-form.tsx` | Select de los cuatro slugs y tamaño en ml, con `name` |
| `backoffice/src/components/catalog/catalog-list.tsx` | Las celdas leen el producto |
| `web/src/lib/api/contract.ts` | `name-desc`. Notas que pueden ir vacías. `stock` anulable. Concentración que puede ir vacía |
| `web/src/lib/catalog/search-params.ts` | El sort nuevo entra y sale de la URL |
| `web/src/lib/api/http-repository.ts` | Pide `/products`, mapea, no filtra otra vez |
| `web/src/lib/api/__tests__/contract.test.ts` | El doble HTTP habla el cable de 017. Los casos de fixtures quedan en el mock |
| `web/src/components/catalog/product-card.tsx` | Sin notas y sin agotado cuando no hay datos |
| `web/src/components/catalog/sort-select.tsx` | Cuatro órdenes. Sale Relevancia |
| `web/src/components/product/olfactive-pyramid.tsx` | No se monta si las tres listas están vacías |
| `web/src/i18n/messages/es.json`, `en.json` | `catalog.sortNameDesc` |
| `docker/docker-compose.yml` | El servicio `web` del stack completo usa `API_MODE=http` |

`web/docker-compose.yml` sigue con default `mock`: `up web` y el
`npm test` con `--no-deps` no necesitan la API. El compose de
`docker/` es el que levanta tienda y API juntas, y ahí el default
pasa a `http`.

## 3 · Columnas

`family` es uno de `ambar-especias`, `florales`, `gourmand`,
`maderas`, o null. `size_ml` es un entero mayor que 0, o null.

En `POST` y `PATCH`, si el campo viene y no cumple, 422 con el
detalle de validación que ya usa 013. Si no viene, queda null (alta)
o no se toca (`PATCH`, igual que el resto de los opcionales).

El formulario del panel siempre los manda. El select deja de usar
`ambar` / `floral` / `madera` / `fresco`. El input de tamaño deja el
placeholder `100 ML` y pasa a numérico, en mililitros. `Para` sigue
sin `name` y sin columna.

Las celdas de Familia y Tamaño, hoy un `—` fijo, muestran la etiqueta
del slug y `{size_ml} ml`. Null sigue en raya.

El contrato Zod del panel, que es `strictObject`, suma
`family: z.string().nullable()` y
`size_ml: z.number().int().positive().nullable()`.

## 4 · Lectura

`ReadyDep` sale de `list_products` y de `read_product`. Entra una
dependencia opcional: si el header no trae bearer, el actor es null;
si trae un bearer inválido o vencido, sigue el 401 de hoy (no se
disfraza de anónimo). Un bearer válido sigue pasando por
`require_password_changed`.

Sin actor:

- el listado agrega `Product.visibility == visible`;
- el detalle de una fila que no es `visible` es 404, el mismo cuerpo
  que un id inexistente;
- la respuesta es `ProductStore`.

Con actor, no se fuerza la visibilidad y la respuesta es
`ProductPublic`, que ahora también lleva `family` y `size_ml`.

`ProductStore` incluye `id`, `name`, `description`, `price`, `type`,
`brand`, `visibility`, `photos`, `photo_urls`, `category_id`,
`tag_ids`, `family`, `size_ml`, `created_at`, `updated_at`. No incluye
`cost`, `sku`, `bar_code`, `discount`, `weight`, `length`, `width`,
`height`.

`@audited(action="read", resource="products", public=True)`. El
decorator, si `public` y no hay `user_id`, retorna el resultado de la
ruta. Si hay `user_id`, persiste como ahora. Las demás rutas no pasan
`public` y siguen en 401 cuando falta el actor.

Los query, todos opcionales:

| Query | SQL |
|-------|-----|
| `family` repetido | `family IN (...)` |
| `brand` repetido | `brand IN (...)` |
| `size` repetido | `size_ml IN (...)` |
| `priceMin` | `price >=` |
| `priceMax` | `price <=` |
| `q` | `unaccent(lower(name)) ILIKE` el patrón, con `%` y `_` escapados |
| `sort` | ver abajo |
| `limit` | el de 013: default 50, máximo 100 |

La migración habilita `unaccent` (`CREATE EXTENSION IF NOT EXISTS`).
El patrón también pasa por `unaccent` y `lower`, del lado de SQL, no
armado a mano en Python con otra tabla de acentos.

`sort` ausente o desconocido: `name ASC, id ASC`. `name-desc`:
`name DESC, id ASC`. `price-asc` y `price-desc`: el precio en esa
dirección y después el nombre ASC y el `id`. No se ordena en
memoria.

La vidriera manda `limit=100`. El panel no manda `limit` y sigue en
50. No se sube el máximo.

`GET /products/facets`, también público y declarado antes de
`/{product_id}` para que `facets` no se parsee como UUID. Cuenta
sólo visibles: familias, marcas, tamaños y el mínimo y máximo de
`price`. El `http-repository` lo usa en `getFacets`. Sin bearer. No
reemplaza el listado.

## 5 · Vidriera

`createHttpCatalogRepository` deja de pedir `/api/v1/products`. Pide
`{API_BASE_URL}/products` con `toSearchParams` más `limit=100`, y
`{API_BASE_URL}/products/{id}` para `getProduct`. `getFacets` pide
`/products/facets`. `search` pide el listado con `q` y `limit` igual
al tope que ya tiene el overlay. `getRelated` resuelve `[]`.

El mapeo a `Product`:

| Contrato | Cable |
|----------|--------|
| `id`, `slug` | `id` |
| `name`, `description` | igual |
| `brand` | `brand` o `""` |
| `family` | `family` o `""` |
| `concentration` | `""` |
| `size` | `{ ml: size_ml, label: "{n} ml" }` o null |
| `price` | `{ amount, currency: "ARS" }`. `amount` es el entero en pesos; un precio con centavos se redondea al entero más cercano, mitad hacia arriba |
| `notes` | tres listas vacías |
| `stock` | null |
| `images.packshot` | `photo_urls[0]` o null |
| `images.thumbnails` | hasta tres URLs siguientes |
| `images.alt` | el nombre |
| `badge` | ausente |

`productListSchema` sigue siendo `{ items, total }`. `total` es el
largo de la lista devuelta (el GET de 013 no pagina con offset; no
se inventa un total distinto del recorte).

`productSortSchema` suma `name-desc` y saca `relevance`. El default
de `catalogQuerySchema` pasa a `name-asc`. Una URL vieja
`sort=relevance` cae en ese default, que es lo que `parseSort` ya
hace con un valor desconocido.

`productMatchesQuery` se queda para el mock y para apagar chips
(RF-2): la página puede seguir pidiendo el listado sin filtros y
calcular `unavailableFacets`. La grilla que se ve es sólo
`listProducts(query)` contra el GET que ya trae los filtros. En
`http` ese método no filtra en proceso.

La tarjeta: si `notes` están vacías, no renderiza el párrafo. Si
`stock` es null, no muestra «Agotado» y el botón de agregar no se
deshabilita por stock. Si `size` es null, la línea mono es sólo la
marca. La pirámide no se monta cuando las tres listas están vacías.
El link sigue siendo `/catalogo/[slug]` con el id.

`API_MODE` del servicio `web` en `docker/docker-compose.yml` pasa de
`mock` a `http`. `API_BASE_URL` ya apunta a `http://api:8000`. El
servidor de Next es quien llama: el browser no resuelve `api` y no
hace falta CORS. La foto es la URL firmada, que el `<img>` carga
igual que en el panel.

## 6 · Tests

Pytest de la API (el de siempre, con Postgres de test). Vitest de
`web` y de `backoffice` con `--no-deps`.

| AC | Dónde |
|----|--------|
| 1 | Pytest: sin bearer, sólo `visible`, y las claves prohibidas no están en el JSON |
| 2 | Pytest: 200 el visible, 404 el `hidden`, el mismo 404 un id que no existe |
| 3 | Pytest: con bearer hay un `hidden` y está `cost`. `POST` sin bearer sigue 401 |
| 4 | Pytest del query combinado. Vitest del `http-repository`: la URL lleva esos parámetros y la grilla no importa `productMatchesQuery` en el page del catálogo |
| 5 | Pytest: `Jazmín` con `q=jazmin`; sin `sort`, nombre A–Z; `name-desc` al revés; dos precios iguales se desempatan por `id` |
| 6 | Pytest: slug ajeno y `size_ml=0` son 422. Vitest del formulario: el alta manda `family` y `size_ml`. La fila del panel muestra el slug y los ml |
| 7 | Vitest de la tarjeta con notas vacías y `stock: null`. La pirámide no está en el documento. Pytest del 404 ya está en AC-2 |
| 8 | Pytest: el GET anónimo no suma filas en `audits`. El GET con bearer sí |

El suite de `contract.test.ts` que hoy corre el mock y el HTTP contra
los mismos fixtures de Bharara se parte. El mock sigue afirmando
«vainilla» y los relacionados. El HTTP afirma el mapeo y la query
contra un doble que responde `ProductStore`, no el contrato ya
mapeado. No se baja la aserción del mock para que el HTTP pase.

Los tests de 013 que crean un producto sin `family` siguen en verde:
null es válido en la API.

## 7 · Riesgos

- La URL firmada vence a la hora, igual que la miniatura del panel.
  Recargar `/catalogo` pide otra.
- 100 publicados es el techo. El siguiente no aparece y no hay página 2.
- Una fila vieja, sin familia ni tamaño, desaparece en cuanto el
  cliente elige ese chip. Hay que editarla en el panel.
- `sort=relevance` guardado en un marcador pasa a nombre A–Z.
- El carrito que tenía un slug de fixture (`bharara-king`) no resuelve
  `getProduct` en `http`. Hay que volver a agregar el producto.
- `unaccent` tiene que existir en la imagen de Postgres del compose.
  El official la trae; falta el `CREATE EXTENSION` de la migración.
- Dos formas de JSON en el mismo path. El panel siempre manda bearer;
  si un día lo pierde, el Zod estricto falla por la falta de `cost`
  y el listado muestra el error de catálogo, no un costo en cero.
