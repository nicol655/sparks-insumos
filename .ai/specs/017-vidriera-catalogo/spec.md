# 017 · La vidriera lee el catálogo

- **Estado:** aprobada (pedido de `/plan`, 2026-09-30)
- **Fecha:** 2026-09-30
- **Padre:** [013](../013-productos/spec.md) guarda el producto.
  [001](../001-storefront-fase-1/spec.md) ya pinta `/catalogo` con
  filtros en la URL ([ADR-0007](../../decisions/0007-filtros-del-catalogo-como-enlaces.md)).
  Esta spec conecta esa grilla al GET de 013. El plan está en
  [`plan.md`](./plan.md) y [ADR-0024](../../decisions/0024-lectura-publica-y-filtros.md).

## Problema

`/catalogo` sigue en fixtures. Los productos cargados en el backoffice
no se ven en la tienda. El GET de productos y el GET por id exigen
sesión, así que la vidriera no puede leerlos. Filtrar y ordenar ocurre
en el proceso de `web/`, no en la API.

## Objetivo

La grilla de `/catalogo` muestra los productos publicados. Familia,
marca, tamaño, rango de precio, coincidencia por nombre y el orden
viajan como query del GET y los resuelve sólo el backend. Esos dos GET
responden sin autenticación.

## Alcance

### Dentro

1. Con `API_MODE=http`, `/catalogo` lista los productos `visible` de
   la API. No mezcla filas de `web/src/fixtures/catalog.ts`.
2. `GET /products` y `GET /products/{id}` responden sin bearer. Un
   anónimo sólo ve `visible`. Un `hidden` o `not_listed` no está en el
   listado, y el GET por id sin bearer responde 404.
3. El mismo GET, con el bearer del operador, sigue devolviendo todas
   las visibilidades y el cuerpo de 013 (incluye costo).
4. `POST` y `PATCH` de productos siguen exigiendo sesión.
5. Los filtros y el orden que ya usa la URL de la vidriera se aplican
   en la API. La grilla pinta esa respuesta y no vuelve a filtrar.
6. Familia y tamaño se guardan, porque sin esas columnas el GET no
   puede filtrarlos. El alta y la edición del panel los envían.

### Fuera

- Persistir Para, stock, pirámide, descripción en inglés o el rol de
  la foto. La tarjeta no inventa notas ni un «agotado».
- Aplicar `discount` al precio.
- Paginación. El tope actual del listado (100) se mantiene.
- Un `PUT`. Roles de operador. Hacer público el bucket.
- Productos relacionados. La ficha no los pide a fixtures: si no hay
  endpoint, la sección sigue oculta.

## Qué se ve

En `/catalogo`, cada publicado muestra la primera foto (`photo_urls[0]`,
o el placeholder si no hay), marca si existe, nombre y precio. El
tamaño, si está guardado, va junto a la marca como ahora (`100 ml`).
No hay línea de notas ni badge de agotado: esos datos no existen.

Los chips siguen siendo los de la vidriera. Familia usa los slugs
`ambar-especias`, `florales`, `gourmand` y `maderas`. Marca y tamaño
salen de lo publicado. El rango sigue en `priceMin` y `priceMax`
(los tres tramos de hoy: hasta 30.000, 30.000–50.000, desde 50.000).
El texto libre es `q` y mira sólo el nombre. El select de orden ofrece
nombre A–Z, nombre Z–A, precio de menor a mayor y precio de mayor a
menor. Sin `sort`, el orden es nombre A–Z.

La ficha `/catalogo/{id}` abre ese producto si está publicado. La
pirámide no se muestra. El link de la tarjeta usa el id como slug.

En el panel, Familia y Tamaño dejan de ser una raya: muestran lo
guardado. El select de familia usa los cuatro slugs de la vidriera.
«Fresco & acuático» sale del select: no es un filtro de la tienda.
Tamaño es un entero en mililitros. Para y stock siguen sin guardarse.

## Filtros

Sobre los publicados (y, con bearer, sobre el conjunto que ya ve el
panel):

| Parámetro | Regla |
|-----------|--------|
| `family` | Slug. Repetido: unión. Cruza con el resto: intersección |
| `brand` | Igual al texto guardado. Repetido: unión |
| `size` | Mililitros, entero positivo. Repetido: unión |
| `priceMin`, `priceMax` | Inclusivos, sobre `price`. Uno solo acota ese lado |
| `q` | Subcadena del nombre, sin distinguir mayúsculas ni acentos |
| `sort` | `name-asc`, `name-desc`, `price-asc`, `price-desc`. Otro valor cuenta como `name-asc` |

Un producto sin familia no entra en un filtro de familia. Igual el
tamaño. Sin esos filtros, sí se lista.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como cliente veo en `/catalogo` los productos publicados en el panel |
| US-2 | P0 | Como cliente filtro y ordeno, y el recorte lo hace el GET |
| US-3 | P0 | Como cliente abro un publicado sin iniciar sesión |
| US-4 | P0 | Como operador sigo viendo borradores y el costo, con el bearer |

## Criterios de aceptación

1. Sin header `Authorization`, `GET /products` responde 200 y sólo
   incluye filas `visible`. El JSON de cada ítem no trae `cost`, `sku`,
   `bar_code`, `discount` ni medidas. Sí trae `price`, `photo_urls`,
   `family` y `size_ml`.
2. Sin bearer, `GET /products/{id}` de un `visible` responde 200 con
   ese mismo recorte. El de un `hidden` o `not_listed` responde 404.
3. Con bearer de operador, el listado sigue trayendo las tres
   visibilidades y el costo. `POST` y `PATCH` sin bearer siguen en 401.
4. `family=gourmand&family=florales&brand=Lattafa&size=100&priceMin=30000&priceMax=50000&q=rosa&sort=price-desc`
   recorta en la API: unión dentro de cada faceta, intersección entre
   facetas, precio inclusivo, `q` sólo en el nombre. La grilla de
   `/catalogo` muestra ese resultado y no llama a `productMatchesQuery`.
5. `q=jazmin` encuentra «Jazmín». `sort` ausente ordena por nombre A–Z.
   `name-desc` invierte el nombre. Empate: `id` ascendente.
6. Crear o editar desde el panel persiste `family` y `size_ml`. Un
   slug fuera de los cuatro, o un `size_ml` que no sea entero positivo,
   responde 422 y no escribe. Las columnas Familia y Tamaño del panel
   muestran el valor guardado.
7. La tarjeta no renderiza notas ni «Agotado» para un producto de la
   API. La ficha de un publicado no muestra la pirámide. La de un id
   que el anónimo no puede leer es 404.
8. Un GET anónimo no inserta auditoría. Un GET con bearer de operador
   sigue insertando la fila `read` de hoy.
