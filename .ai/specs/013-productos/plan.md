# Plan técnico · 013 Productos, categorías y tags

- **Estado:** implementado (2026-09-28)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0018](../../decisions/0018-catalogo-dinero-fotos-e-ids.md).
  Reusa [0010](../../decisions/0010-stack-api.md) (FastAPI, SQLAlchemy
  async, Alembic, pytest en Docker), la guarda de
  [007](../007-api-autenticacion/spec.md) y el decorator de
  [012](../012-auditoria/spec.md) ([ADR-0017](../../decisions/0017-auditoria-opt-in-y-contexto.md)).
  No toca el contrato de la vidriera
  ([ADR-0003](../../decisions/0003-capa-de-datos-desacoplada.md)).

## 1 · Enfoque

Cuatro tablas y tres routers. Categorías y tags hablan JSON. El
producto habla multipart cuando hay archivos. Las fotos pasan por un
puerto; los tests no salen a la red.

Cada ruta exitosa lleva `@audited`. La ruta hace `flush` y no
`commit`: el commit del decorator confirma la fila de negocio y la de
auditoría juntas. Si el decorator rechaza el payload, `get_session`
revierte el flush. Las rutas de 007 no se tocan y siguen sin auditar.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `api/alembic/versions/0003_catalog.py` | Las cuatro tablas, enums, índices parciales |
| `api/app/models/catalog.py` | `ProductCategory`, `Tag`, `Product`, tabla `product_tags` |
| `api/app/models/__init__.py` | Exporta los tres modelos |
| `api/app/schemas/catalog.py` | DTOs de entrada y de salida |
| `api/app/storage.py` | Puerto `ObjectStorage`, boto3, doble no va aquí |
| `api/app/api/deps.py` | `get_storage` |
| `api/app/api/routes/product_categories.py` | CRUD |
| `api/app/api/routes/tags.py` | CRUD |
| `api/app/api/routes/products.py` | CRUD con archivos |
| `api/app/main.py` | Incluye los tres routers |
| `api/app/config.py` | Bucket, región y claves, vacías por defecto |
| `api/.env` | Bucket, región y claves. Compose las carga con `env_file`. El repo no crea el bucket |
| `api/.env.example` | Los cuatro nombres, sin valores secretos |
| `api/tests/conftest.py` | `_reset` borra unión, productos, tags y categorías antes de `audits` |
| `api/tests/fakes.py` | `MemoryStorage` |
| `api/tests/e2e/test_catalog.py` | AC-2…AC-9 |
| `api/tests/unit/test_storage_keys.py` | Validación de archivos, sin red |

`web/` y `backoffice/` no se editan. Dependencias nuevas: `boto3` y
`python-multipart` (FastAPI lo exige para `Form` y archivos), agregadas
con uv dentro del contenedor (ADR-0018). No se suma un check a
`verify.json`: `api-test` y `api-lint` ya cubren `api/`.

## 3 · Tablas

`0003`, `down_revision = "0002"`.

```text
product_categories
  id                    integer pk generated always as identity
  uuid                  uuid not null unique
  name                  varchar(200) not null
  product_category_id   integer null → product_categories.id  ON DELETE RESTRICT
  created_at            timestamptz not null default now()
  updated_at            timestamptz not null default now()

tags
  id          uuid pk
  name        varchar(80) not null unique
  created_at  timestamptz not null default now()
  updated_at  timestamptz not null default now()

products
  id           uuid pk
  name         varchar(200) not null
  description  text not null
  cost         numeric(12, 2) not null  check (cost >= 0)
  price        numeric(12, 2) not null  check (price >= 0)
  type         product_type not null          -- digital | physical
  weight       numeric(12, 2) null
  length       numeric(12, 2) null
  width        numeric(12, 2) null
  height       numeric(12, 2) null
  sku          varchar(64) null
  bar_code     varchar(64) null
  brand        varchar(120) null
  visibility   product_visibility not null    -- visible | hidden | not_listed
  discount     integer null
  photos       jsonb not null
  category_id  integer not null → product_categories.id  ON DELETE RESTRICT
  created_at   timestamptz not null default now()
  updated_at   timestamptz not null default now()

product_tags
  product_id  uuid not null → products.id  ON DELETE CASCADE
  tag_id      uuid not null → tags.id      ON DELETE RESTRICT
  primary key (product_id, tag_id)
```

Índices únicos parciales: `products.sku` y `products.bar_code` donde
no son null. Índices en las tres FK.

`_reset`, en este orden: `product_tags`, `products`, `tags`,
`product_categories`, `audits`, `sessions`, `users`. Si se olvida la
unión o el producto, el `DELETE FROM users` no es el que falla: falla
el de categorías, por el RESTRICT.

## 4 · API

Guarda `require_password_changed` en las quince rutas. Tag OpenAPI
igual al recurso: `product-categories`, `tags`, `products`.

El JSON de categoría usa `id` para el uuid. El padre se llama
`product_category_id` y también es un uuid, o null. El serial no se
serializa. El producto manda `category_id` como uuid de la categoría
y `tag_ids` como lista de uuid (vacía si no hay). La respuesta repite
esos uuid, más `photos` como lista de claves.

Listados: `order_by(created_at.desc(), id.desc())`,
`Query(ge=1, le=100)`, default 50. Por encima de 100, 422 de FastAPI.
Respuesta: lista, no un sobre.

Errores, siempre `{code, detail}`:

| Caso | HTTP | `code` |
|------|------|--------|
| Categoría, tag o producto inexistente | 404 | `not_found` |
| Categoría con productos o con hijas; tag en uso | 409 | `in_use` |
| Ciclo o padre igual a sí misma | 422 | `category_cycle` |
| Alta sin archivos, o archivo que no es JPEG, PNG ni WebP, o de más de 5 MB, o más de 8 | 422 | `photos_rejected` |
| Nombre de tag repetido, sku o código de barras repetido | 409 | `conflict` |
| El almacenamiento falla | 502 | `storage_failed` |

Textos en español, del mismo estilo que 007. Un cuerpo JSON lleva
`extra=forbid`. Una medida negativa o un dinero negativo es 422 de
Pydantic.

PATCH de categoría y de tag: sólo los campos enviados. PATCH de
producto: igual, y si el multipart trae al menos un archivo, esa lista
reemplaza `photos`. Si no trae archivos, `photos` queda.

Borrado de producto: cascade de `product_tags` en la base. Después del
commit, `storage.delete` de cada clave. Si el borrado del objeto
falla, la fila ya no está; se loguea y la respuesta sigue en 204.
Borrar no toca la categoría ni el tag.

## 5 · Fotos

```text
class ObjectStorage(Protocol):
    async def put(self, body: bytes, content_type: str) -> str: ...
    async def delete(self, key: str) -> None: ...
```

`put` genera la clave (`products/{uuid}{ext}`), sube y la devuelve.
No adivina el tipo sólo por el nombre: tienen que coincidir el
`Content-Type` y los primeros bytes (JPEG `FF D8`, PNG, RIFF/WEBP).
Si no coinciden, 422 antes de llamar a `put`.

Boto3 es síncrono. La implementación lo corre en `asyncio.to_thread`.
`get_storage` arma el cliente con las settings. En tests,
`app.dependency_overrides[get_storage]` devuelve `MemoryStorage`, que
guarda los bytes en un dict y devuelve claves predecibles.

El bucket no se crea desde el repo. `get_storage` arma boto3 con
`AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID` y
`AWS_SECRET_ACCESS_KEY` de `api/.env`. Si esas cuatro están vacías, la
implementación real responde 502 al subir. Los tests no llegan ahí
porque usan el doble.

Orden en el alta: validar campos, categoría y tags; validar archivos;
`put` de cada uno; `flush` del producto con esas claves; retorno; el
decorator hace `commit`. Si `put` falla a mitad, se intenta `delete`
de las claves ya subidas y no hay flush. Si el flush falla después,
pueden quedar objetos. ADR-0018 lo acepta.

## 6 · Auditoría

Decorator debajo del de la ruta, como 012. Recurso según la tabla.
Payload:

| Operación | Payload |
|-----------|---------|
| GET lista | `null` |
| GET uno | `{"id": "<uuid>"}` |
| POST | el DTO público, con dinero como string de dos decimales y `photos` como claves |
| PATCH | `id` más los campos que cambiaron, en el mismo formato |
| DELETE | `{"id": "<uuid>"}` |

El binario no entra en el callable. La ruta no tiene un parámetro
llamado `result`. Un 422 o un 404 sale antes del retorno exitoso, así
que no hay fila (AC-7).

## 7 · Tests

Doble de almacenamiento en todos los e2e de esta spec. No hay
credenciales en el caso de prueba.

| AC | Dónde |
|----|--------|
| AC-1 | Insertar una categoría, un producto con `photos` `["k"]` y medidas null; leer `cost`/`price`; un `category_id` entero inventado levanta integridad |
| AC-2 | Sin header, 401 en POST y GET de los tres. Admin semilla, 403. Cuenta registrada: alta, lectura, cambio y baja de categoría, tag y producto |
| AC-3 | Multipart sin archivo → 422, cero productos, cero `put`. Con dos PNG chicos, `photos` es la lista de claves del doble, en orden |
| AC-4 | `category_id` desconocido → 404 y cero productos. Padre válido persiste. Padre que cierra el ciclo → 422 |
| AC-5 | `tag_ids` con un uuid desconocido → 404 y cero productos. Dos productos con el mismo tag: las dos uniones existen |
| AC-6 | `SELECT cost, price` devuelve `1200.10`. `discount = 10` y `price` sigue `1200.10` |
| AC-7 | Tras cada CRUD exitoso, una fila nueva con ese `user_id`, `action` y `resource`. `payload::text` no contiene la cabecera del PNG. Un 422 deja el conteo igual. El test de 012 de login y `/me` sigue en cero |
| AC-8 | DELETE de categoría con hija o con producto → 409. DELETE de tag usado → 409. DELETE de producto → 204, cero uniones, y el doble recibió `delete` de esas claves |
| AC-9 | `limit=101` → 422. OpenAPI: los paths de los tres recursos, métodos sólo los cinco, esquema bearer |

El archivo que no es imagen se prueba en unitario, sin base: los
bytes `hello` con `Content-Type: image/png` se rechazan.

## 8 · Trade-offs

- **Un commit, el del decorator.** En 007 la ruta confirma y el audit
  es un segundo commit. Acá la ruta sólo hace flush, así que el
  producto no queda escrito si el audit rechaza el payload. No se
  cambia el decorator.
- **Listados auditados.** Cada GET agrega una fila con payload null.
  El pedido pide auditar el CRUD entero, lectura incluida. El volumen
  queda aceptado.
- **502 si el bucket no está.** La suite no lo cubre con AWS real. Lo
  cubre un doble que lanza, y se afirma el 502 y que no hubo insert.
- **Sin rol.** Igual que la lectura de `audits`. La constitución 14
  queda escrita y sin efecto hasta la spec de roles.
- **`discount` opaco.** Guardarlo sin aplicarlo evita inventar un
  cuarto descuento encima de la constitución 9.

## 9 · Riesgos

- Un objeto puede quedar en el bucket si la base falla después del
  `put`, o si el `delete` posterior al 204 falla. No hay barrido en
  esta rebanada.
- El JSON de producto no entra en `productSchema` de la vidriera.
  Conectarlo sin una spec de mapeo rompe ADR-0003.
- El admin de bootstrap sigue en 403, así que probar a mano en
  Swagger exige una cuenta que ya cambió la clave, o cambiarla antes.
- `boto3` nuevo alarga el build de la imagen. Se lockea con uv, no
  con un pin escrito en el plan.

## 10 · Constitución

| Principio | Cómo se cumple |
|-----------|----------------|
| 4 | boto3 sólo por las fotos, justificado en ADR-0018. Sin otra librería de imágenes |
| 5 | Cada tabla y cada ruta sale de la spec. El numérico, el puerto y el uuid están en el ADR |
| 6 | Claves por entorno. El runtime no crea el bucket. El binario no entra al audit |
| 7 | Misma guarda, mismo `DomainError`, mismo decorator, mismos uuid en la URL |
| 8–13 | No se tocan piso, descuentos, envío, pagos ni textos legales. `discount` no se aplica |
| 14 | No se crea un rol. El hueco queda escrito |
| 15 | No se inventa stock ni destacados |
| 17 | No se pinta catálogo en el backoffice. Las filas de la maqueta no se siembran |
| 1–3 | Spec y ADR antes del código. `web/` y `backoffice/` quedan quietos |
