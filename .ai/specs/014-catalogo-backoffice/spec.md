# 014 · Catálogo del backoffice

- **Estado:** aprobada (pedido de `/plan`, 2026-09-28)
- **Fecha:** 2026-09-28
- **Padre:** [013](../013-productos/spec.md) es el contrato que esta
  pantalla escribe. [011](../011-backoffice-cascaron/spec.md) ya dejó
  `/catalogo` con título. [010](../010-backoffice/spec.md) y
  [ADR-0014](../../decisions/0014-sesion-backoffice-session-storage.md)
  dejan el bearer en el cliente. La constitución 17 y
  [ADR-0015](../../decisions/0015-diseno-backoffice-y-reglas-de-operacion.md)
  fijan el artefacto del panel como única fuente visual.

## Problema

El operador no puede ver ni cargar un producto. `/catalogo` sólo muestra
el título. La API ya guarda el producto (013), pero el panel no la llama.

El artefacto describe un catálogo con stock, familia, «Para», pirámide,
texto en inglés y fotos con rol. Esas columnas no existen en 013. Pintarlas
vacías o con las filas de la maqueta las haría pasar por datos vivos.

## Objetivo

En Catálogo, el operador ve los productos que ya están en la API y puede
crear uno nuevo. El formulario tiene un control por cada campo que 013
acepta. Si falta un obligatorio, el panel lo dice y no envía la petición.
Si igual llega al backend, la API responde 422 y el panel muestra ese
error.

## Alcance

### Dentro

1. Listado en `/catalogo` de lo que devuelve `GET /products`.
2. Alta en `/catalogo/nuevo` con todos los campos de escritura de 013,
   fotos incluidas.
3. Alta mínima de categoría y de tag en esa misma pantalla, porque el
   producto no se puede guardar si la categoría no existe.
4. El panel llama a la API con el bearer que ya tiene la sesión. El
   navegador no abre `http://api:8000`.
5. Tests de la pantalla y del cliente HTTP. El alta con foto contra AWS
   no entra en esos tests: 013 ya la cubre con el doble en memoria.

### Fuera

- Editar o borrar un producto, una categoría o un tag.
- Conectar la vidriera. `web/src/lib/api/contract.ts` sigue igual.
- Stock, familia, «Para», pirámide olfativa, descripción en inglés y
  rol de cada foto (packshot, atomizador, notas, lifestyle). No hay
  columna. No se dibujan como si estuvieran cargados.
- Aplicar `discount` al precio, ni el 5/10% ni el 5% de socio.
- Roles. Sigue la constitución 14: hasta esa spec, cualquier cuenta que
  ya pasa `/me` puede escribir el catálogo.
- Búsqueda del encabezado, paginación más allá del primer page de 50,
  URL pública de la foto, cambio de clave dentro del panel.
- Sembrar filas de la maqueta (constitución 17).

## Qué se ve

La cáscara de 011 no cambia: menú, encabezado, paleta, español. Catálogo
deja de ser sólo el título y usa el layout del artefacto
([ADR-0021](../../decisions/0021-catalogo-layout-del-artefacto.md)).

Antetítulo: «N referencias · 0 con stock bajo». El cero es el recuento
real: 013 no guarda unidades, así que ninguna referencia cae en 1 a 3.
Título: «Catálogo». Acción: «Nuevo producto».

Encima de la tabla: búsqueda «Buscar por nombre o marca», chips Todo /
Perfumes / Sets / Body splash, y los dos select del artefacto (stock y
orden). El resumen es «N DE M», sin un total de unidades inventado.

La tabla tiene las columnas del artefacto: foto (franja, no `<img>`),
Producto, Familia, Tamaño, Precio, Stock, Publicado, Editar. Producto
muestra el nombre, la marca o `—`, el nombre de la categoría y la
cantidad de fotos (`1 foto`, `3 fotos`). Familia, tamaño y stock no
existen en 013: se ven como `—` y los botones de stock no cambian nada.
Publicado usa las etiquetas de abajo, no «Sí» / «No». «Editar» es el
rótulo del artefacto; esta spec no abre ficha. Vacío, sin filtros:
«Todavía no hay productos.» Con filtros que no matchean: «Ningún
producto coincide con el filtro.» Sin filas de ejemplo. El precio sale
en ARS, `es-AR`, con los dos decimales que devuelve la API.

«Nuevo producto» abre el cajón fijo a la derecha, encima del listado,
con el velo sobre el resto de la pantalla. `/catalogo/nuevo` abre el
mismo cajón. El encabezado es: kicker «Nuevo producto», título el
nombre escrito o «Sin nombre», cerrar y cancelar vuelven al listado, y
el botón es «Crear producto». Los grupos y las
cuatro ranuras de foto (packshot, atomizador, notas, lifestyle) son los
del artefacto. Etiqueta, familia, Para, tamaño, unidades, pirámide y la
descripción en inglés se ven y no se envían: 013 no tiene esas columnas.

La visibilidad se guarda con el enum de 013. Las etiquetas:

| Valor API | Etiqueta |
|-----------|----------|
| `visible` | Publicado |
| `hidden` | Borrador |
| `not_listed` | No listado |

«No listado» no está en el artefacto. Se muestra igual, porque si no el
operador no podría guardar ese valor.

El badge `5` de Catálogo en el menú sale. Era copia fija de 011 y
mentiría con un listado real. Los otros badges del menú quedan como
están.

El alta es otra ruta, `/catalogo/nuevo`, dentro del mismo panel. Un
botón «Nuevo producto» en el listado abre esa ruta. Al guardar bien,
vuelve al listado y el producto nuevo está en la tabla.

## Formulario

Un control por campo que `POST /products` acepta. Los obligatorios no
tienen valor por defecto escondido: el operador elige tipo, visibilidad
y categoría.

| Campo | Control | Obligatorio |
|-------|---------|-------------|
| `name` | texto | sí |
| `description` | área de texto | sí |
| `cost` | decimal ≥ 0 | sí |
| `price` | decimal ≥ 0 | sí |
| `type` | Digital o Físico | sí |
| `visibility` | Publicado, Borrador o No listado | sí |
| `category_id` | una categoría ya cargada | sí |
| `photos` | archivos, 1 a 8, JPEG, PNG o WebP, hasta 5 MB cada uno | sí |
| `weight`, `length`, `width`, `height` | decimal ≥ 0 | no |
| `sku`, `bar_code`, `brand` | texto | no |
| `discount` | entero | no. Se guarda. No cambia el precio |
| `tag_ids` | tags ya cargados | no |

Si falta un obligatorio, o la foto no cumple el límite, el panel muestra
el mensaje junto al formulario y no llama a la API. El de las fotos es
el mismo texto que ya devuelve 013: «El producto necesita entre 1 y 8
fotos JPEG, PNG o WebP de hasta 5 MB.» El de los otros campos nombra
cuáles faltan.

Los opcionales vacíos no se envían.

En la misma pantalla, sin salir a otra sección:

- «Nueva categoría»: nombre obligatorio, padre opcional entre las que ya
  hay. `POST /product-categories`. Si sale bien, queda elegida.
- «Nuevo tag»: nombre. `POST /tags`. Si sale bien, queda marcado.

No hay pantalla de administración de categorías ni de tags. No se editan
ni se borran acá.

## Errores de la API

El cliente muestra `detail` cuando es un texto. Si `detail` es la lista
de validación de FastAPI, una sola frase: «Faltan datos o no son
válidos.»

| Respuesta | Qué ve el operador |
|-----------|--------------------|
| 422 | El `detail`, o la frase de arriba |
| 404 `not_found` | El `detail` (categoría o tag que ya no está) |
| 409 `conflict` | El `detail` (nombre de tag, sku o código de barras repetido) |
| 401 / 403 | El `detail`. No se abre otro login |
| 502 `storage_failed` | El `detail` |

La cuenta semilla sigue en 403 hasta cambiar la clave. Esta spec no
agrega esa pantalla.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como operador veo los productos cargados, o el vacío si no hay |
| US-2 | P0 | Como operador creo un producto con todos los campos de la base |
| US-3 | P0 | Si me falta un obligatorio, lo veo en el formulario y no se envía |
| US-4 | P0 | Si el backend recibe el alta incompleta, responde 422 y lo veo |
| US-5 | P0 | Puedo crear la categoría y el tag que el producto necesita |

## Requisitos no funcionales

| # | Requisito |
|---|-----------|
| RNF-1 | El navegador no llama a `api`. No se abre CORS. El bearer no va a una cookie |
| RNF-2 | Los tests del panel no escriben en la base `sparks` ni llaman a AWS |
| RNF-3 | El gate `backoffice-test` sigue en `--no-deps` |
| RNF-4 | Español. Misma paleta y cáscara que 011 |

## Criterios de aceptación

1. `/catalogo` sin productos muestra «Todavía no hay productos.» y ningún
   nombre de la maqueta.
2. Un producto devuelto por el cliente aparece con nombre, marca o `—`,
   nombre de categoría, precio, etiqueta de visibilidad y cantidad de
   fotos.
3. Enviar el alta con el nombre vacío no llama al cliente y muestra qué
   falta. Igual con descripción, costo, precio, tipo, visibilidad,
   categoría y fotos.
4. Una foto de más de 5 MB, un noveno archivo o un tipo que no es JPEG,
   PNG ni WebP tampoco se envía, y se ve el texto de 013.
5. Si el cliente devuelve 422 con `detail` texto, el formulario lo
   muestra. Si `detail` es la lista de FastAPI, se ve «Faltan datos o no
   son válidos.»
6. Un alta que el cliente da por buena vuelve a `/catalogo` y el nombre
   nuevo está en la tabla.
7. Un test de integración del cliente, sobre HTTP de loopback, comprueba
   el bearer, el multipart con los campos obligatorios y el archivo, el
   parseo del listado, y que un alta sin `name` se lee como 422.
8. El proxy sólo reenvía `GET` y `POST` de `/products`,
   `/product-categories` y `/tags`, con el `Authorization` que mandó el
   navegador. No acepta una URL arbitraria.
9. El ítem Catálogo del menú no muestra `5`. Pedidos sigue mostrando `2`.
10. `web/` no cambia. La API no gana endpoints: el 422 de un campo
    obligatorio ausente ya lo da FastAPI, y el de las fotos ya lo da 013.
