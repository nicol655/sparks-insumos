# Plan técnico · 014 Catálogo del backoffice

- **Estado:** implementado (2026-09-28)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0019](../../decisions/0019-catalogo-backoffice-proxy-y-campos.md).
  Reusa el bearer en `sessionStorage`
  ([ADR-0014](../../decisions/0014-sesion-backoffice-session-storage.md)),
  el texto fijo del resto del panel
  ([ADR-0016](../../decisions/0016-cascaron-backoffice-texto-estatico.md))
  y el contrato de 013
  ([ADR-0018](../../decisions/0018-catalogo-dinero-fotos-e-ids.md)).
  No toca la vidriera
  ([ADR-0003](../../decisions/0003-capa-de-datos-desacoplada.md)).

## 1 · Enfoque

`/catalogo` deja de ser sólo el título. Una pantalla de cliente pide el
listado y el alta. El bearer sale del store de 010. La petición del
navegador pega en el propio backoffice (`/api/catalog/...`). Esa ruta
reenvía a `API_BASE_URL` (`http://api:8000` dentro de Docker).

No hace falta un endpoint nuevo. `POST /products` ya es multipart y ya
responde 422 si falta un campo o si las fotos no sirven. El panel
corta antes los mismos casos, para que el operador vea el mensaje sin
esperar la red.

La categoría y el tag se crean en el alta, con el JSON que 013 ya
acepta. Sin eso, una base vacía no puede guardar el primer producto.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `backoffice/src/lib/catalog/contract.ts` | Zod del producto, la categoría y el tag, tal como los devuelve 013 |
| `backoffice/src/lib/catalog/client.ts` | `createCatalogClient(baseUrl, fetch)`: listar, crear producto, crear categoría, crear tag |
| `backoffice/src/lib/catalog/form.ts` | Qué falta antes de enviar. No habla con la red |
| `backoffice/src/lib/catalog/labels.ts` | Etiquetas de tipo y de visibilidad |
| `backoffice/src/app/api/catalog/products/route.ts` | `GET` y `POST` hacia `{API_BASE_URL}/products` |
| `backoffice/src/app/api/catalog/product-categories/route.ts` | `GET` y `POST` hacia `/product-categories` |
| `backoffice/src/app/api/catalog/tags/route.ts` | `GET` y `POST` hacia `/tags` |
| `backoffice/src/components/catalog/catalog-list.tsx` | Tabla y vacío |
| `backoffice/src/components/catalog/product-form.tsx` | Alta, categoría y tag |
| `backoffice/src/app/(panel)/catalogo/page.tsx` | Deja el título suelto y monta el listado |
| `backoffice/src/app/(panel)/catalogo/nuevo/page.tsx` | Monta el formulario |
| `backoffice/src/content/nav.ts` | Catálogo sin `count` |
| Tests colocados junto a `client`, `form`, las rutas y los componentes | AC-1…AC-9 |

`web/` y `api/` no se editan. No hay dependencia nueva. El gate no gana
un check: `backoffice-test` ya corre Vitest, y `api-test` ya cubre el
422 real contra Postgres.

## 3 · Quién llama a la API

El page de Next sigue siendo de servidor y no lee el token. El listado
y el formulario son componentes de cliente. Leen `accessToken` del
store. Llaman a `/api/catalog/...` en el mismo origen, con
`Authorization: Bearer <token>`.

La route handler:

- Lee ese header. Si no viene, responde 401 y no llama a la API.
- Reenvía el método, el header y el cuerpo a la ruta fija de 013.
- En el alta de producto copia el `FormData` (campos y archivos). No
  arma otro cuerpo.
- Devuelve el status y el JSON de la API tal cual.

Tres módulos, uno por recurso. No hay un proxy genérico: una ruta
`[...path]` aceptaría cualquier URL y eso no hace falta.

`API_BASE_URL` se lee en el servidor, como ya hace el login. No se
expone al navegador.

## 4 · Cliente

`createCatalogClient` recibe la base. En el navegador la base es `""`
(mismo origen, prefijo `/api/catalog`). En el test de integración la
base es el servidor de loopback, que imita el JSON de 013.

| Método del cliente | HTTP |
|--------------------|------|
| `listProducts` | `GET /products` |
| `createProduct` | `POST /products` multipart |
| `listCategories` | `GET /product-categories` |
| `createCategory` | `POST /product-categories` JSON |
| `listTags` | `GET /tags` |
| `createTag` | `POST /tags` JSON |

El multipart usa los mismos nombres que `api/app/api/routes/products.py`:
`name`, `description`, `cost`, `price`, `type`, `visibility`,
`category_id`, `photos` (un part por archivo) y, sólo si vienen,
`weight`, `length`, `width`, `height`, `sku`, `bar_code`, `brand`,
`discount`, `tag_ids`.

Costo, precio y medidas viajan como texto decimal con punto (`1200.10`),
que es lo que Pydantic ya parsea. El panel no manda coma.

El resultado es `{ ok: true, ... }` o `{ ok: false, status, detail }`.
`detail` texto se conserva. Una lista de validación se aplana a
«Faltan datos o no son válidos.» Un JSON que no parsea, o una red
caída, es el mismo fallo genérico que el login llama `unavailable`,
con una frase en español para la pantalla.

## 5 · Pantallas

**Listado.** Al montar pide productos y categorías. Cruza `category_id`
con el nombre. Si la categoría no está en la lista, muestra el uuid.
Precio con `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })`.
Fotos: la longitud de `photos`. Límite: el default de la API (50). Si
vuelven 50, una línea dice que se ven los 50 más nuevos. No hay página
siguiente.

**Alta.** Al montar pide categorías y tags. El botón de guardar corre
`form.ts` primero. Si falta algo, el mensaje queda en el formulario y
el cliente no se llama. Si está completo, `createProduct`. 201: `router.push("/catalogo")`.
Cualquier otro status: el `detail` en el formulario, sin navegar.

«Nueva categoría» y «Nuevo tag» son formularios chicos en la misma
página. Un error de esos (409 de nombre repetido, 422 de ciclo en el
padre) se muestra ahí y no borra lo que el operador ya escribió del
producto.

El descuento lleva una línea corta: se guarda y no modifica el precio.

## 6 · Validación en el cliente

`form.ts` es pura. Obligatorios: `name`, `description`, `cost`, `price`,
`type`, `visibility`, `category_id`, y al menos un archivo. El decimal
obligatorio es un número ≥ 0 con hasta dos decimales. El opcional vacío
pasa. El opcional con texto que no es decimal no pasa. `discount`, si
viene, es un entero. Las fotos: cantidad 1–8, tipo `image/jpeg`,
`image/png` o `image/webp`, tamaño ≤ 5 × 1024 × 1024. El mensaje de
fotos es el de 013. El de los campos nombra los que faltan, en español
(Nombre, Descripción, Costo, Precio, Tipo, Visibilidad, Categoría).

Esto no reemplaza el 422. El test de integración manda un `POST` sin
`name` al doble HTTP y espera 422. El pytest de 013 sigue siendo la
prueba contra FastAPI de verdad.

## 7 · Menú

En `nav.ts`, Catálogo pierde `count`. `shell.test.tsx` y `panel.test.ts`
dejan de exigir `"5"` en ese ítem y siguen exigiendo `"2"` en Pedidos.

## 8 · Tests

Van en el `npm test` actual. No levantan `api` ni Postgres. Por eso el
gate sigue con `--no-deps`.

| Test | Prueba |
|------|--------|
| `form.test.ts` | AC-3 y AC-4, sin DOM |
| `client.integration.test.ts` | AC-7. Entorno `node`. Un `http.Server` en un puerto efímero imita 013: exige `Authorization`, lee el multipart, responde 201 o 422 si falta `name`, y el `GET` devuelve el producto creado en esa misma corrida |
| `route.test.ts` | AC-8. La handler recibe un `fetch` inyectado. Comprueba la URL fija, el bearer y que un path fuera de la lista no existe (no hay catch-all) |
| `catalog-list.test.tsx` | AC-1 y AC-2, con el cliente falso |
| `product-form.test.tsx` | AC-3, AC-5 y AC-6. El alta inválida no llama `fetch`. El 422 pinta `detail`. El 201 empuja `/catalogo` |
| `shell` / `panel` | AC-9 |

No se manda el test contra el contenedor `api` encendido. Esa base es
`sparks`, y un alta de prueba le dejaría filas. La foto, además, iría a
S3 o fallaría con 502 si no hay credenciales. El 201 con archivo y el
422 de FastAPI ya están en `api/tests/e2e/test_catalog.py`.

## 9 · Riesgos

- La foto no se puede mostrar. El listado dice cuántas hay. Una URL
  firmada queda para otra spec.
- La cuenta `admin@sparksinsumos.com` no puede crear nada hasta cambiar
  la clave. El panel muestra el 403. No hay pantalla de cambio.
- Cualquier cuenta con la clave ya cambiada escribe el catálogo. No se
  inventa el rol de Administración.
- El artefacto tiene ejes que esta pantalla no dibuja (stock, familia,
  «Para», pirámide, inglés, rol de la foto). Están en el ADR-0019 para
  no reabrirlos en la implementación.
- Un `next dev` ya levantado puede 404 una ruta nueva hasta reiniciar
  `sparks-backoffice`.
