# Tasks · 013 Productos, categorías y tags

- **Estado:** cerrada (T325–T331)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0018](../../decisions/0018-catalogo-dinero-fotos-e-ids.md)

No se toca `web/` ni `backoffice/`. No se decora ninguna ruta de 007.
Cada tarea de comportamiento se escribe en rojo y después el mínimo
de código que la pone verde. Pytest corre en Docker contra `sparks_test`.
El almacenamiento de los tests es un doble en memoria.

## Setup

- [x] **T325 · Tablas del catálogo** → AC-1, RNF-2
  Migración `api/alembic/versions/0003_catalog.py`
  (`down_revision = "0002"`): `product_categories`, `tags`, `products`,
  `product_tags`, enums, checks de dinero ≥ 0, índices únicos parciales
  de `sku` y `bar_code`.
  Modelo `api/app/models/catalog.py` y export en `models/__init__.py`.
  `tests/conftest.py`: `_reset` borra `product_tags`, `products`, `tags`
  y `product_categories` antes de `audits`.
  Test primero en `api/tests/unit/test_catalog_tables.py`: medidas null,
  `cost`/`price` `1200.10`, y un `category_id` inexistente no entra.

## Foundational

- [x] **T326 · Puerto de fotos** `[P]` → fotos, RNF-1, RNF-3, ADR-0018
  Puede ir en paralelo con T325.
  `api/app/storage.py`: `inspect_photo`, `ObjectStorage`, `S3Storage`
  (boto3 en `asyncio.to_thread`; sin credenciales, 502 y no llama).
  `api/app/config.py`: `aws_region`, `aws_s3_bucket`,
  `aws_access_key_id`, `aws_secret_access_key`, vacías por defecto.
  `api/app/api/deps.py`: `get_storage`.
  `api/tests/fakes.py`: `MemoryStorage`.
  `api/.env.example` y `api/docker-compose.yml`: los cuatro nombres, sin
  secretos.
  `api/scripts/create_product_bucket.py` existió para el alta única.
  Se borró: los buckets se administran fuera del repo.
  `boto3` entra con `uv add` dentro del contenedor, y se reconstruye
  la imagen `api`.
  Test primero en `api/tests/unit/test_storage_keys.py`: PNG, JPEG y
  WebP válidos; `hello` con tipo PNG se rechaza; más de 5 MB se rechaza;
  tipo y cabecera que no coinciden se rechazan.

## US-1 · Categorías

- [x] **T327 · CRUD de categorías** → US-1, AC-2, AC-4, AC-7, AC-8
  Depende de T325.
  `api/app/schemas/catalog.py` y `api/app/api/routes/product_categories.py`.
  Padre por uuid. Ciclo → 422 `category_cycle`. Borrar con hijas o
  productos → 409 `in_use`. Guarda `require_password_changed`.
  Cada ruta exitosa lleva `@audited` (`product_categories`). La ruta
  hace flush; el decorator confirma.
  `main.py` incluye el router.
  Test primero en `api/tests/e2e/test_catalog.py`: 401, 403 del admin
  semilla, alta con padre, ciclo, 409 y una fila de audit por operación.

## US-2 · Tags

- [x] **T328 · CRUD de tags** `[P]` → US-2, AC-2, AC-5, AC-8
  Depende de T325. Puede ir con T327.
  `api/app/api/routes/tags.py`. Nombre único → 409 `conflict`.
  Borrar un tag en uso → 409 `in_use`. Audit `tags`.
  Mismos tests de auth y de audit. El tag compartido por dos productos
  se afirma junto con T329.

## US-3 · Productos

- [x] **T329 · CRUD de productos con fotos** → US-3, AC-2…AC-6, AC-8
  Depende de T326, T327 y T328.
  `api/app/api/routes/products.py`. Multipart. Sin archivos en el alta,
  o más de 8, o un archivo inválido: 422 `photos_rejected`, cero `put`.
  Categoría o tag inexistente: 404 y cero filas. `discount` no toca
  `price`. Borrar el producto quita la unión y llama a `delete` de las
  claves. Si `put` falla, 502 `storage_failed` y no hay fila.
  Audit `products`. El payload no lleva el binario.
  Tests en `api/tests/e2e/test_catalog.py` con `MemoryStorage`.

## US-4 · Lectura auditada y contrato

- [x] **T330 · Listado, ficha y OpenAPI** → US-4, AC-7, AC-9
  Depende de T327–T329. Puede cerrarse en los mismos tests.
  Listados de más nueva a más vieja. `limit` default 50, máximo 100;
  101 es 422. GET de lista con payload null; GET de una ficha con
  `{"id": …}`.
  `api/tests/e2e/test_openapi.py`: los seis paths y sólo
  `get`/`post` en la colección y `get`/`patch`/`delete` en la ficha,
  con bearer.

## Polish

- [x] **T331 · Verify y handoff** → RNF-1, RNF-4
  Depende de T325–T330.
  `docker compose -f docker/docker-compose.yml run --rm --no-deps api uv run ruff check`
  y `docker compose -f docker/docker-compose.yml run --rm api uv run pytest`.
  Arreglar la causa. Tildar esta lista. `architecture.md`, `stack.md`,
  el glosario y `progress.md` pasan a decir que 013 está en el código.
  El contrato de la vidriera sigue en fixtures.

## Dependencias

```
T325 ──→ T327 (US-1) ──→ T329 (US-3) ──→ T330 ──→ T331
T326 [P] ─────────────→ T329
T325 ──→ T328 [P] ────→ T329
```

## Definition of Done

- T325–T331 tildadas.
- AC-1…AC-9 cubiertos por pytest contra `sparks_test`, sin red hacia AWS.
- `ruff check` y `pytest` de `api` en verde, dentro de Docker, con la
  imagen que ya tiene `boto3`.
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- `web/` y `backoffice/` sin cambios. Ninguna ruta de 007 llama a
  `audited`.
