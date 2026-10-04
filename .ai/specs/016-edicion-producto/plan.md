# Plan técnico · 016 Edición de producto, miniatura y visibilidad

- **Estado:** implementado (2026-09-29)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0023](../../decisions/0023-miniatura-y-patch-por-ranuras.md).
  Reusa el `PATCH` de 013
  ([ADR-0018](../../decisions/0018-catalogo-dinero-fotos-e-ids.md)),
  el proxy del panel
  ([ADR-0019](../../decisions/0019-catalogo-backoffice-proxy-y-campos.md),
  [ADR-0020](../../decisions/0020-catalogo-401-cierra-sesion.md))
  y el orden de ranuras
  ([ADR-0022](../../decisions/0022-fotos-del-cajon-por-ranura.md)).
  No toca la vidriera
  ([ADR-0003](../../decisions/0003-capa-de-datos-desacoplada.md)).

## 1 · Enfoque

Tres cambios, en este orden de dependencia.

La API firma cada clave al leer un producto y acepta un plan de
ranuras en el `PATCH`. El panel no inventa un `PUT`.

El proxy gana `PATCH /api/catalog/products/{id}`. Sigue siendo una ruta
concreta, no un `[...path]`.

El listado pinta `photo_urls[0]`, convierte «Editar» y Publicado en
botones, y abre el cajón de 015 con el producto. La papelera y el
reemplazo viven en el estado del cajón hasta el guardado.

Familia, tamaño, stock y la descripción en inglés no se precargan:
013 no los tiene (constitución 17, ADR-0019).

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `api/app/storage.py` | `presign_get(key) -> str` en el puerto. S3 firma un GET de 3600 s. El doble devuelve `memory:{key}` |
| `api/app/schemas/catalog.py` | `photo_urls: list[str]` en `ProductPublic`. `to_audit` lo saca |
| `api/app/api/routes/products.py` | Al armar la respuesta, firma. El `PATCH` entiende `photo_slots` |
| `api/tests/fakes.py` | `presign_get` |
| `api/tests/e2e/test_catalog.py` | AC-6 del lado API, visibilidad sola, ranura ajena, cola de fotos |
| `api/tests/unit/test_s3_client.py` | La firma usa bucket, clave y `ExpiresIn=3600`, sin red |
| `backoffice/src/lib/catalog/contract.ts` | `photo_urls` |
| `backoffice/src/lib/catalog/client.ts` | `updateProduct(id, body)` |
| `backoffice/src/lib/catalog/form.ts` | En edición, una foto guardada cuenta como foto |
| `backoffice/src/lib/catalog/proxy.ts` | Reenviar `PATCH` a `/products/{uuid}` |
| `backoffice/src/app/api/catalog/products/[id]/route.ts` | Sólo `PATCH` |
| `backoffice/src/components/catalog/catalog-list.tsx` | Miniatura, botón Editar, botón Publicado |
| `backoffice/src/components/catalog/product-form.tsx` | Modo edición: valores, ranuras remotas, papelera |
| Tests colocados de esos módulos | AC-1…AC-5 |

`web/` no se toca. `.ai/specs/013-productos/spec.md` ya apunta a esta
regla de ranuras.

## 3 · Lectura de la foto

`ObjectStorage` gana `presign_get`. `S3Storage` llama a
`generate_presigned_url("get_object", Params={Bucket, Key}, ExpiresIn=3600)`
con el cliente que ya arma `_client`. No se abre otro.

`_public` sigue sin URLs. Una función al lado firma `row.photos` y
llena `photo_urls`. Una firma que lanza deja `""` en esa posición y
loguea la clave; el 200 del listado se mantiene.

`ProductPublic.photo_urls` viaja en GET, POST y PATCH. `to_audit` hace
`data.pop("photo_urls", None)` antes de guardar la auditoría, para no
persistir una URL que vence.

El contrato Zod del panel exige `photo_urls` como `string[]`, alineado
con `photos`. El `<img>` del listado usa el índice 0 si no está vacío.
`alt=""`. Clases del marco actual: `h-12 w-10 object-cover`.

## 4 · PATCH de ranuras

Campos nuevos, todos opcionales, multipart como el resto:

| Campo | Significado |
|-------|-------------|
| `photo_slots` | `1` activa esta regla. Ausente: el `PATCH` de 013 |
| `slot_key_0` … `slot_key_7` | Clave de esta fila que se queda en ese índice |
| `slot_file_0` … `slot_file_7` | Archivo nuevo en ese índice. Si también hay clave, el archivo gana y la clave se borra al commitear |

Índices vacíos no se envían. La lista resultante recorre `0..7` y se
queda con lo ocupado, en orden. Más de 8 ocupadas no puede ocurrir por
el tope del índice.

Antes de subir:

- cero ocupadas → 422 `photos_rejected`, detalle de 013. La fila y el
  bucket quedan igual;
- clave que no está en `row.photos`, o repetida → el mismo 422;
- cada archivo pasa por `inspect_photo`. Uno malo → 422, sin `put`.

Después se suben sólo los archivos nuevos. El commit escribe la lista.
Si el commit falla, `_drop` de las claves nuevas. Si sale bien, `_drop`
de las claves viejas que no están en la lista nueva.

El `POST` no lee `photo_slots`. Sigue exigiendo de 1 a 8 `photos`.

La visibilidad de la fila no manda `photo_slots` ni `photos`. El merge
actual copia sólo `visibility`. El resto de la fila no se toca.
El cajón manda `tags_present=1`: si no hay `tag_ids`, la lista queda
vacía. Sin ese campo, omitir `tag_ids` no las toca. `brand`, `sku` y
`bar_code` vacíos se envían y la API los guarda como null.

El cajón de edición siempre manda `photo_slots=1`, los campos de 013
que ya manda el alta, `slot_key_i` o `slot_file_i` para las cuatro
ranuras, y `slot_key_4` en adelante con `photos.slice(4)` del producto
abierto. Así una quinta foto que no se pinta no se borra.

## 5 · Panel

`forwardCatalog` hoy rechaza todo lo que no sea `GET` o `POST` sobre
tres paths exactos. Se agrega `forwardProductPatch(request, id)`:

- `id` tiene que ser un UUID. Si no, 404 `not_found`;
- el upstream es `{API_BASE_URL}/products/{id}`;
- método `PATCH`, cuerpo `arrayBuffer`, `Content-Type` del request
  (incluye el boundary), `Authorization` como en el POST;
- 401 sin bearer, 502 si el fetch lanza. Misma copia de 014.

`updateProduct` arma el `FormData` y usa los dos headers de ADR-0020.
Un 401 sigue en `endSession`.

`CatalogList` guarda `editing: Product | null`. «Editar» hace
`setEditing(product)` y abre el cajón. `ProductForm` recibe `product`
opcional y `key={product?.id ?? "new"}` para que los `defaultValue`
nazcan de esa fila.

Inputs no controlados: `defaultValue` desde el producto (`name`,
`brand`, `description`, `price`, `cost`, `type`, `visibility`,
`discount`, `weight`, `length`, `width`, `height`, `sku`, `bar_code`).
`categoryId` y `tagIds`, que ya son estado, se inicializan con
`product.category_id` y `product.tag_ids`.

La ranura pasa de `{ file, url } | vacío` a:

| Estado | Preview | Al guardar |
|--------|---------|------------|
| vacía | el nombre de la ranura | no se manda |
| remota | `photo_urls[i]`, pie = último segmento de la clave, cortado con `shortenFileName` | `slot_key_i` |
| archivo | blob, pie = nombre del archivo, como en 015 | `slot_file_i` |

Elegir un archivo sobre una remota la reemplaza y revoca el blob
anterior si lo había. La clave vieja deja de estar en el cuerpo: el
API la borra al commitear.

La papelera es un `<button type="button" aria-label="Quitar foto">`
con un SVG de trazo, `cursor-pointer`, oculto hasta `group-hover` o
`focus-visible`. `preventDefault` y `stopPropagation` para que el
`<label>` no abra el selector. Pone la ranura vacía. Sólo se renderiza
si `product` vino al cajón.

`validateDraft` en edición cuenta ranuras ocupadas más las claves de
cola. Cero: el mismo aviso «Fotos», sin `updateProduct`. Un archivo
que no es JPEG, PNG o WebP, o de más de 5 MB, sigue el texto de 013.

El botón de envío en edición dice «Guardar cambios». El kicker dice
«Editar producto». El alta no cambia esos textos.

Publicado es un `<button type="button" className="cursor-pointer">`
que envuelve la marca actual. `aria-pressed` es true si
`visibility === "visible"`. El clic arma un `FormData` con un solo
campo `visibility` y llama a `updateProduct`. Mientras esa fila espera,
el botón queda `disabled`. Si la respuesta es el producto, se reemplaza
esa fila. Si es 401, `endSession`. Otro error usa el `detail` ya
visible en el listado y no cambia la marca.

«Editar» es `<button type="button" className="cursor-pointer hover:underline">`.

## 6 · Tests

Pytest de la API, con el doble en memoria, sin AWS. Vitest del
backoffice, `--no-deps`.

| AC | Dónde |
|----|--------|
| 1 | `catalog-list`: con `photo_urls[0]` hay `img`; con `""` no hay `img` y queda la franja |
| 2 | El botón Editar tiene `cursor-pointer` y `hover:underline`. El clic muestra «Editar producto», el nombre y el precio |
| 3 | Guardar llama a `updateProduct` con el id y no a `createProduct` |
| 4 | El control Publicado tiene `cursor-pointer`. `visible` → sólo `hidden`. `not_listed` → sólo `visible` |
| 5 | Subir sobre una remota manda `slot_file_0` y no manda esa `slot_key_0`. La papelera no deja un `input` activo y el guardado no incluye esa clave. Cancelar no llama a `updateProduct` |
| 6 | `validateDraft` / el formulario no envían si no queda ninguna foto. Pytest: `photo_slots=1` sin ranuras es 422, la fila sigue con sus claves y `deleted` no crece. El `POST` sin fotos sigue en 422 |
| 7 | Diff vacío en `web/` |

Pytest además: un `PATCH` sólo con `visibility` no cambia `photos` ni
llama a `delete`. Una `slot_key` de otro producto es 422. `photos[4]`
reenviada como `slot_key_4` sigue en la fila. `to_audit` no contiene
`photo_urls`. `presign_get` del doble es `memory:` más la clave. El
unit de boto3 afirma `get_object` y `ExpiresIn=3600` con el cliente
parcheado.

El test de 015 que guarda el alta sigue en `createProduct`. El de cero
fotos del alta no se debilita.

## 7 · Riesgos

- La URL firmada vence a la hora. La miniatura se rompe en una pestaña
  quieta. Recargar el listado la pide de nuevo.
- `s3:GetObject` tiene que seguir en la policy. Sin ese permiso la
  firma se genera igual y el `<img>` recibe 403. El listado no lo
  puede distinguir de una URL vencida.
- Un cliente que mande `photo_slots` y se olvide una clave la borra.
  El panel reenvía la cola precisamente por eso.
- Las fotos 5 a 8 no se ven en el cajón. Se conservan, pero esta
  pantalla no las quita ni las reemplaza.
- `defaultValue` no se actualiza si el mismo formulario cambia de
  producto. El `key` del cajón fuerza el remonte.
