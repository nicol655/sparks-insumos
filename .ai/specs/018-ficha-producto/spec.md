# 018 · La ficha sigue el artefacto

- **Estado:** implementada (T359–T366, 2026-09-30)
- **Fecha:** 2026-09-30
- **Fuente visual:** el artefacto
  `https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj`, pantalla `isProduct`
  (leída el 2026-09-30). Es la única fuente del layout de esta ficha.
- **Padre:** [017](../017-vidriera-catalogo/spec.md) ya abre
  `/catalogo/{id}` con el GET público. [001](../001-storefront-fase-1/spec.md)
  pintó la ficha contra fixtures. Esta spec cambia el dibujo, no el cable.

## Problema

La ficha que se ve no es la del artefacto. El título no lleva la
descripción del perfume, la familia está en una «Ficha técnica» que el
artefacto no tiene, y «También te puede gustar» desaparece cuando no hay
filas. En `API_MODE=http` el producto ya llega del GET. Hay que llenar
el diseño con esa respuesta, sin inventar lo que el GET no trae.

## Objetivo

`/catalogo/[slug]` (inglés `/catalogue/[slug]`) calza la pantalla de
producto del artefacto. Cada valor de producto sale del contrato que
`http-repository` ya arma. La sección de relacionados queda armada y,
sin filas, muestra un empty state. No se crea el endpoint.

## Alcance

### Dentro

1. El layout de la pantalla `isProduct`: miga, dos columnas desde 900px,
   galería adhesiva desde 1140px, kicker, título, descripción, fila de
   precio, compra, pirámide, grilla de datos, acordeón y relacionados.
2. Esos huecos se llenan con el producto que ya devuelve el repositorio
   (`name`, `description`, `price`, `brand`, `family`, `size`,
   `images`, `notes`, `concentration`, `stock`).
3. «También te puede gustar» se renderiza siempre. Con lista vacía, un
   empty state. Con filas, las tarjetas del artefacto.
4. Copy estático del artefacto que no es un dato del producto:
   cuotas, «Consultar este perfume», cuerpos del acordeón, miga.

### Fuera

- Un `GET` de relacionados, o calcularlos en `web/` a partir del
  listado. `getRelated` en `http` sigue devolviendo `[]`.
- Persistir notas, stock, concentración, duración, estela, ocasión o
  SKU. No se derivan del precio ni del id.
- Cambiar la tarjeta del catálogo, el carrito, el drawer ni el panel.
- Cobrar con tarjeta. La línea de cuotas es el texto del artefacto, el
  mismo que ya está en la home. No abre un checkout.

## Qué se ve

Miga mono 10px: Inicio / Catálogo / nombre. Inicio y Catálogo son
enlaces. El nombre no.

Desde 900px, dos columnas con raya al medio. Por debajo, una columna.
La galería es adhesiva (`top: 74px`) sólo desde 1140px. Foto grande
4:5, tope 62vh. Tres miniaturas 1:1, separación 12px. La grande arranca
en la primera foto (`photo_urls[0]` o el placeholder). Cada miniatura
con URL la reemplaza; otro clic en la misma vuelve a la primera. Una
ranura sin URL es el placeholder y no es botón. No se repite la primera
foto para rellenar huecos.

Kicker oro 10px: marca y familia traducida, unidas con ` · `. Si falta
una, se omite. Si faltan las dos, no hay kicker. El `h1` es el nombre,
`clamp(34px, 4.4vw, 56px)`. Debajo, la descripción del producto
(14px, máx. 48ch).

Fila con rayas arriba y abajo: precio `clamp(28px, 3vw, 40px)`, la
frase «Hasta 3 cuotas sin interés», y el stock sólo si el número
existe. Stock desconocido (`null`, el GET de hoy) no dice «En stock».
El verde `#4CA455` a 10px no se usa: el contraste no da. Se reusa
`StockBadge` (tinta si hay unidades, meta si es 0).

Si el stock no es 0: stepper, «Agregar al carrito» y, debajo, el enlace
con punto verde «Consultar este perfume» a `wa.me` con el número ya
configurado. El mensaje es el del artefacto: «Hola! Consulta por
{nombre}». Si el stock es 0, se mantiene lo de hoy: «Sin stock» y
«Consultar stock por WhatsApp», sin el botón de agregar.

La pirámide sólo si alguna lista de notas tiene texto. Tres celdas con
raya de 1px (una columna bajo 560px). Sin notas, el bloque no está.
La grilla de datos, mismo borde, dos columnas desde 560px, sólo tiene
celdas con valor: concentración si el string no está vacío, tamaño si
hay `size`. No hay título «Ficha técnica». No hay duración, estela,
ocasión ni SKU. No se escribe «Eau de parfum» porque el `type` del
perfume no viaja en el contrato de la vidriera.

Acordeón, los tres cerrados al entrar:

| Título | Cuerpo |
|--------|--------|
| Descripción | «Fragancia probada por nuestro equipo antes de entrar al catálogo. Se envía en su caja original con celofán. Lote y vencimiento visibles en el envase.» |
| Envíos y retiro | «Envíos por Correo Argentino y transporte a todo el país, a cotizar según tamaño y peso. Retiro sin cargo en Franklin, CABA, con turno previo. Despacho en 24/48 h hábiles.» |
| Cambios y devoluciones | «Cambios dentro de los 10 días con el producto cerrado. Si el envase llega dañado, envianos una foto por WhatsApp y lo reponemos.» |

Ese cuerpo de Descripción no repite el texto que ya está bajo el `h1`.
El signo `+` / `−` del acordeón sigue a 24px: a 12px el oro no pasa el
contraste.

«También te puede gustar» es un `h2` (`clamp(26px, 3vw, 38px)`). Con
filas, grilla `auto-fit` / `minmax(min(100%, 230px), 1fr)`, gap 26px.
Cada tarjeta: foto 3/3.5, nombre a 19px, precio a 14px. Sin marca, sin
notas y sin «Agregar». Sin filas, el `h2` queda y una línea: «Todavía
no hay sugerencias.» No hay tarjetas ni un segundo fetch.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como cliente veo la ficha del artefacto con el nombre, el precio, la descripción y las fotos del GET |
| US-2 | P0 | Como cliente no leo duración, stock ni «Eau de parfum» inventados |
| US-3 | P0 | Como cliente veo «También te puede gustar» aunque todavía no haya sugerencias |

## Criterios de aceptación

1. La miga enlaza Inicio y Catálogo. Hay un solo `h1`, el nombre. La
   descripción bajo el título es `product.description`. El precio es el
   del producto, con el mismo formato de hoy.
2. El kicker muestra marca y la etiqueta de familia (`families.<slug>`).
   Marca vacía u familia vacía se omiten. Slug desconocido no se
   imprime crudo.
3. La foto grande inicial es `images.packshot`. Hay tres ranuras. Una
   URL de miniatura, al clic, pasa a la foto grande; el segundo clic
   vuelve al packshot. Una ranura `null` no es botón y no copia el
   packshot.
4. Con `stock: null` no aparece «En stock» ni «Sin stock». Se ven el
   stepper, «Agregar al carrito» y «Consultar este perfume» hacia
   `wa.me` del número configurado. Con `stock: 0` no está «Agregar al
   carrito» y sigue el enlace de stock. Con stock mayor a 0 se ve
   «En stock» en tinta, no en verde.
5. Notas vacías: no hay pirámide. Concentración vacía y tamaño null: no
   hay grilla de datos. No se renderizan Duración, Estela, Ocasión,
   SKU ni «Eau de parfum».
6. Los tres paneles del acordeón arrancan cerrados. Al abrir
   Descripción se lee el texto de caja y celofán, no
   `product.description`. Los otros dos cuerpos son los de la tabla de
   arriba, en los dos idiomas.
7. Lista de relacionados vacía: el `h2` «También te puede gustar» y la
   línea de empty state, sin lista. Lista con ítems: esas tarjetas
   (foto, nombre, precio) dentro de una lista. La página no pide otra
   ruta que `getProduct` y `getRelated`. `getRelated` en `http` sigue
   en `[]`.
8. Un publicado sin marca, sin familia y sin tamaño igual muestra
   nombre, descripción, precio y fotos. Sigue siendo 404 si el GET
   anónimo no lo encuentra.
