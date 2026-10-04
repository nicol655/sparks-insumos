# 013 · Productos, categorías y tags

- **Estado:** aprobada (pedido de `/plan`, 2026-09-28)
- **Fecha:** 2026-09-28
- **Padre:** [007](../007-api-autenticacion/spec.md) da el bearer y la guarda
  de clave. [012](../012-auditoria/spec.md) da el decorator. Esta spec no
  cambia `web/` ni `backoffice/`.

## Problema

No hay dónde guardar un producto. Categoría, tags y fotos tampoco. Sin
eso no se puede auditar un alta ni mostrar el catálogo desde la API.

La vidriera sigue leyendo fixtures en esta rebanada. La lectura
pública, los filtros y el orden los toma
[017](../017-vidriera-catalogo/spec.md).

## Objetivo

Tres recursos autenticados, con CRUD y una fila de auditoría por cada
operación que termina bien: producto, categoría y tag. El alta de un
producto sube sus fotos a un bucket S3 de Sparks y guarda las claves.
La categoría y los tags tienen que existir antes de asociarlos.

## Alcance

### Dentro

1. Tablas `products`, `product_categories`, `tags` y la unión
   producto–tag.
2. CRUD JSON de categorías y de tags.
3. CRUD de productos. El alta y el reemplazo de fotos viajan como
   archivos, se suben a S3 y la fila guarda la lista de claves.
4. Auditoría de cada CRUD exitoso de los tres recursos, con el
   decorator de 012.
5. La misma autenticación que `/me` en todas esas rutas.

### Fuera

- Conectar la vidriera. `web/src/lib/api/contract.ts` (ADR-0003) sigue
  siendo el contrato de la tienda: familia, concentración, notas,
  stock, packshot y precio entero en ARS. Este modelo no lo reemplaza.
- Pantalla de catálogo en el backoffice.
- Stock, destacados, familias olfativas, slug, badge ni texto
  alternativo de la foto. La constitución 15 no tiene columna todavía.
- Aplicar `discount` al precio. Tampoco el 5/10% ni el 5% de socio.
- Roles. Sigue valiendo la constitución 14, y 007 no tiene rol: hasta
  esa spec, cualquier cuenta que ya pasa `/me` puede escribir el
  catálogo. No se inventa un rol de operador en esta rebanada.
- Búsqueda, filtros, paginación por cursor, ni borrado de una sola
  foto sin reemplazar la lista.
- Crear el bucket en el arranque de la API, ni llamarlo desde pytest.

## Modelo

Los nombres de columna van en inglés, como `users`. El pedido escribió
`phisics`, `lenght` y `peso`: aquí son `physical`, `length` y `weight`.

### `product_categories`

Una categoría puede colgar de otra. Perfumes → Perfumes mujer.

| Columna | Regla |
|---------|--------|
| `uuid` | UUID4, único. Es el id que ve la API |
| `id` | Entero, autoincremental, clave primaria. Lo usan las FK. No sale en el JSON |
| `name` | Texto, obligatorio |
| `product_category_id` | Entero, null, FK a `product_categories.id`. El padre. Null si es raíz |
| `created_at`, `updated_at` | Los pone la base. El cliente no los manda |

No puede ser padre de sí misma ni cerrar un ciclo.

### `tags`

El pedido no nombra otras columnas. Con esto alcanza para el CRUD y
para la asociación.

| Columna | Regla |
|---------|--------|
| `id` | UUID4, clave primaria |
| `name` | Texto, obligatorio, único |
| `created_at`, `updated_at` | Los pone la base |

### `products`

| Columna | Regla |
|---------|--------|
| `id` | UUID4, clave primaria |
| `name` | Texto, obligatorio |
| `description` | Texto, obligatorio |
| `cost` | Precio de compra, obligatorio. Numérico, dos decimales, ≥ 0. No es un `float` de IEEE |
| `price` | Precio de venta, obligatorio. Igual que `cost` |
| `type` | `digital` o `physical`, obligatorio |
| `weight` | Número, null. Sin unidad y sin conversión |
| `length`, `width`, `height` | Número, null. Sin unidad y sin conversión |
| `sku` | Texto, null. Si viene, es único |
| `bar_code` | Texto, null. Si viene, es único |
| `brand` | Texto, null |
| `visibility` | `visible`, `hidden` o `not_listed`, obligatorio |
| `discount` | Entero, null. Se guarda. No modifica `price` |
| `photos` | Lista ordenada de claves de S3, obligatorio, al menos una |
| `category_id` | FK al `id` entero de la categoría, obligatorio. En el JSON el cliente manda el `uuid` de esa categoría |
| `created_at`, `updated_at` | Los pone la base |

`weight`, `length`, `width`, `height`, `sku`, `bar_code`, `brand` y
`discount` son opcionales: el pedido no los marcó.

### Unión

`product_tags` (`product_id`, `tag_id`). Un tag en muchos productos y
un producto con muchos tags. Los tags del alta son opcionales. Si se
mandan, todos tienen que existir ya. No hay CRUD de la unión: se escribe
sólo a través del producto.

## Escritura de fotos

Al crear el producto, y al actualizarlo si vienen archivos nuevos, la
API sube cada archivo al bucket y guarda las claves en `photos`, en el
orden recibido. Si no viene ningún archivo en el alta, no hay fila y no
hay objeto. En una actualización, omitir archivos deja la lista como
está. Mandar archivos reemplaza la lista entera.

[016](../016-edicion-producto/spec.md) agrega otra entrada al `PATCH`:
con `photo_slots`, la lista nueva es el plan de ranuras. Cero ranuras
responde 422 y no borra las claves que ya estaban. Sin `photo_slots`,
sigue el párrafo anterior.

Formatos: JPEG, PNG o WebP. Hasta 8 archivos. Hasta 5 MB cada uno.
Otra cosa rechaza el alta y no sube nada.

El bucket es nuevo, sólo para estas fotos. El nombre y la región salen
de variables de entorno. La clave de acceso no se escribe en el repo.
Los tests no llaman a AWS.

## Lectura y borrado

Todas las rutas exigen bearer y la misma guarda que `/me`: sin token,
401 `not_authenticated`; con `must_change_password`, 403
`password_change_required`.

| Método | Ruta | Nota |
|--------|------|------|
| POST, GET, GET `/{id}`, PATCH, DELETE | `/product-categories` | Padre opcional, por el uuid de otra categoría |
| POST, GET, GET `/{id}`, PATCH, DELETE | `/tags` | |
| POST, GET, GET `/{id}`, PATCH, DELETE | `/products` | POST y el PATCH que trae fotos son multipart |

El listado va de la fila más nueva a la más vieja. `limit` opcional,
default 50, máximo 100. Sin filas, `[]`. Un id que no existe es 404
`not_found`.

Borrar una categoría que todavía tiene productos o hijas responde 409 y
no borra. Borrar un tag que todavía está en un producto responde 409 y
no borra. Borrar un producto borra sus uniones con tags y pide borrar
las claves en el bucket. No borra la categoría ni los tags.

Una categoría o un tag inexistente al escribir un producto responde 404
y no crea ni modifica el producto.

## Auditoría

Cada POST, GET, PATCH y DELETE de estos tres recursos que termina bien
escribe una fila con `audited`:

| Qué | `action` | `resource` |
|-----|----------|------------|
| Alta | `create` | `products`, `product_categories` o `tags` |
| Lectura de uno o del listado | `read` | el mismo nombre |
| Cambio | `update` | el mismo nombre |
| Baja | `delete` | el mismo nombre |

El payload no incluye los bytes del archivo. En un listado es null. En
una ficha, el id. En un alta o un cambio, los campos públicos ya
guardados (claves de foto, no el binario). Si la ruta falla, no hay
fila. Login, registro, logout, cambio de clave y `/me` siguen sin
escribir.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como operador autenticado doy de alta una categoría, incluso como hija de otra |
| US-2 | P0 | Como operador autenticado doy de alta un tag y lo reuso en varios productos |
| US-3 | P0 | Como operador autenticado creo un producto con fotos, categoría existente y tags existentes |
| US-4 | P0 | Como operador autenticado leo, corrijo y borro esos tres recursos, y cada operación queda auditada |

## Requisitos no funcionales

| # | Requisito |
|---|-----------|
| RNF-1 | Pytest en Docker, contra `sparks_test`. Sin red hacia AWS |
| RNF-2 | Precio y costo no se guardan en una columna float |
| RNF-3 | Credenciales del bucket sólo por entorno. Nada de secretos en el repo |
| RNF-4 | `web/` y `backoffice/` no se tocan |

## Criterios de aceptación

| # | Criterio |
|---|----------|
| AC-1 | La migración crea las cuatro tablas con las columnas de arriba. `resource` y `payload` no aplican: `photos` y las medidas sí aceptan el caso vacío o null que corresponda. Un `category_id` inexistente no entra |
| AC-2 | Sin bearer, los tres recursos responden 401. Con `must_change_password`, 403. Una cuenta que ya puede llamar a `/me` hace el CRUD |
| AC-3 | Crear un producto sin foto responde 422, no inserta y no sube. Con fotos válidas, la fila guarda las claves que devolvió el almacenamiento, en orden |
| AC-4 | Crear o cambiar un producto con una categoría que no existe responde 404 y no escribe el producto. Una categoría puede tener padre. Un ciclo responde 422 |
| AC-5 | Un tag que no existe responde 404 y no escribe el producto. Dos productos pueden compartir un tag que sí existe |
| AC-6 | `cost` y `price` de `1200.10` se leen igual desde la base. `discount` no cambia `price` |
| AC-7 | Cada CRUD exitoso deja una fila en `audits` con el `user_id` de la sesión, la acción y el recurso. El payload no contiene el binario. Una validación fallida no deja fila. Login y `GET /me` siguen en cero |
| AC-8 | Borrar una categoría con productos o con hijas responde 409. Borrar un tag en uso responde 409. Borrar un producto quita la unión y pide borrar las claves |
| AC-9 | `limit` por encima de 100 responde 422. OpenAPI muestra estos métodos y el bearer. No hay POST público |

## Cerrado el 2026-09-28

1. `physical`, `length` y `weight` corrigen la grafía del pedido. El
   JSON usa esos nombres.
2. Dinero en dos decimales, no en float. El detalle está en
   [ADR-0018](../../decisions/0018-catalogo-dinero-fotos-e-ids.md).
3. El entero de la categoría es interno. La API habla el uuid, como el
   resto de los recursos.
4. El tag es uuid + nombre único. No se agregan color, slug ni otros
   campos.
5. `discount` se persiste y no se interpreta. Peso y medidas tampoco
   tienen unidad.
6. Hasta 8 fotos, 5 MB, JPEG / PNG / WebP.
7. Cualquier cuenta lista escribe el catálogo. El rol de Contenido o
   Administración queda para la spec de roles (constitución 14).
8. Esta spec no alimenta la vidriera.

## Preguntas abiertas

Ninguna que bloquee el plan. Si el descuento tiene que ser un
porcentaje, o si el peso va en gramos, se dice en una spec posterior:
esta no los aplica.
