# Plan técnico · 018 La ficha sigue el artefacto

- **Estado:** implementado
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0025](../../decisions/0025-ficha-sin-datos-inventados.md).
  Reusa [0003](../../decisions/0003-capa-de-datos-desacoplada.md) (la UI
  no hace `fetch`), [0009](../../decisions/0009-kickers-oro-10px.md)
  (kicker oro 10px), [0013](../../decisions/0013-cuenta-sin-datos-inventados.md)
  y recorta la frase de relacionados de
  [0024](../../decisions/0024-lectura-publica-y-filtros.md).

## 1 · Enfoque

Un pase de la ficha que ya existe. No hay ruta nueva ni campo nuevo en
el GET. `page.tsx` sigue pidiendo `getProduct` y `getRelated`. El
dibujo pasa a ser el de `isProduct`. Lo que el contrato trae vacío no
se pinta ([ADR-0025](../../decisions/0025-ficha-sin-datos-inventados.md)).

`API_MODE` no se consulta en los componentes. Lista vacía es empty
state, en `http` y en un mock que no tenga parientes. El mock de
fixtures sigue devolviendo parientes: ahí se ven las tarjetas. Así el
día del endpoint sólo cambia `getRelated`.

Se reusan `Packshot`, `QuantityStepper`, `ButtonPrimary`, `Accordion`,
`StockBadge`, `WhatsappDot` y `GOLD_KICKER`. No se reescribe el
stepper ni el botón para ganar 1px de padding.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `web/src/app/[locale]/catalogo/[slug]/page.tsx` | Miga, grilla del artefacto, intro, orden de bloques |
| `web/src/components/product/product-intro.tsx` | Kicker, `h1`, descripción. Nuevo, para poder testearlo sin el RSC |
| `web/src/components/product/gallery.tsx` | Packshot inicial. Ranuras `null` sin copiar la primera foto |
| `web/src/components/product/purchase-block.tsx` | Fila de precio, cuotas, enlace «Consultar este perfume» |
| `web/src/components/product/olfactive-pyramid.tsx` | Grilla de 1px. Sigue sin montarse si no hay notas |
| `web/src/components/product/spec-table.tsx` | Sólo concentración y tamaño, sin título |
| `web/src/components/product/details-accordion.tsx` | Títulos y cuerpos del artefacto. Descripción ya no es la del perfume. Paneles cerrados |
| `web/src/components/product/related.tsx` | Sección siempre. Empty state o tarjetas del artefacto |
| `web/src/i18n/messages/es.json`, `en.json` | Cuotas, consulta, acordeón, empty state |
| Tests de esos componentes | AC de abajo |

No se toca `api/`, `http-repository.ts` (`getRelated` ya resuelve
`[]`), el contrato Zod ni el panel. `toProduct` ya deja notas vacías,
concentración `""` y `stock: null`.

## 3 · Layout

`page.tsx` arma, en este orden:

1. Miga. `Link` a `/` y a `/catalogo` con `nav.home` y `nav.catalog`.
   El nombre va en un `span` de tinta. La fila es mono 10px,
   `tracking-[0.14em]`, `text-text-meta`, raya inferior
   `border-border-hairline`, padding `16px` y el gutter del artefacto
   `clamp(20px, 4.4vw, 64px)`. Cada enlace lleva `inline-flex min-h-11
   items-center`: a 10px el hit area no llega a 44px y el E2E de touch
   lo marca.
2. Sección en grilla. Una columna bajo `lg` (900). Desde `lg`,
   `lg:grid-cols-2`, raya inferior, y `lg:border-r` en la galería.
   Adhesiva sólo desde `xl` (1140): `xl:sticky xl:top-[74px]`. Por
   debajo de 1140, `static`, como `stickyPos` del artefacto. Padding
   de la galería 28px, gap 12px.
3. Columna de info con padding `clamp(30px, 4vw, 48px)`
   `clamp(20px, 3.8vw, 52px)` `clamp(44px, 5vw, 66px)` y `gap-6`
   (24px).
4. Sección de relacionados con el padding del artefacto:
   `clamp(46px, 5vw, 70px)` `clamp(20px, 4.4vw, 64px)`
   `clamp(56px, 6vw, 90px)`.

`ProductIntro` recibe el producto. El kicker es `GOLD_KICKER`. Familia
con `isFamilySlug` y `FAMILY_MESSAGE`, igual que la grilla de hoy. Las
partes vacías no entran al join. El `h1` usa
`font-display text-[clamp(34px,4.4vw,56px)] leading-[1.02] font-normal`.
La descripción es `text-[14px] font-light leading-[1.7] text-text-muted max-w-[48ch]`.

La pirámide: el rótulo «Pirámide olfativa» queda en mono 10px
`text-text-meta` (en el artefacto ese rótulo no es oro). Las etapas
(Salida, Corazón, Fondo) usan `GOLD_INDEX`. Las notas, display 19px.
Celdas `bg-canvas`, gap de 1px sobre `bg-border-hairline`, una columna
bajo `sm` (560) y tres desde `sm`. Sin `h2` de más: el rótulo sigue
siendo el heading accesible, para no romper el E2E que busca
«Pirámide olfativa».

La grilla de datos no tiene heading. Mismo recuadro de 1px. Una columna
bajo `sm`, dos desde `sm`. Label mono 10px `text-text-meta`. Valor
14px. Si no queda ninguna fila, el componente devuelve `null`.

El acordeón no se reescribe. Se le quita `defaultOpen={["description"]}`.
El signo ya es oro a 24px y el test de contraste lo exige así
([ADR-0009](../../decisions/0009-kickers-oro-10px.md)): el artefacto lo
hereda a 12px y ese tamaño no está permitido.

Colores: tokens. No hay `text-[#4A423B]` ni `bg-[#4CA455]` en un texto.

## 4 · Compra y fotos

`PurchaseBlock` envuelve precio, cuotas y stock en una fila
`flex items-baseline gap-4 border-y border-border-hairline py-[18px]`.
El precio usa `font-display text-[clamp(28px,3vw,40px)]`. Las cuotas
son `text-[12px] font-light text-text-meta`, clave nueva
`product.installments`. El stock, si el número no es `null`, sigue en
`StockBadge` y se empuja con `ml-auto`.

Debajo, la fila del stepper y `ButtonPrimary` (`flex-1`, el botón a
`w-full` con un wrapper `[&>button]:w-full`). El enlace de consulta es
un `<a>` con borde `border-border-strong`, padding 15px, tipo 11px,
`tracking-[0.18em]`, `min-h-11`, y `WhatsappDot`. `buildWhatsappUrl`
con `whatsapp.thisPerfume` (`Hola! Consulta por {name}` /
`Hi! A question about {name}`). El número no se hardcodea.

`stock === 0` no entra a esa fila: queda el camino actual
(`product.askStock`). No se suman dos WhatsApp.

`gallerySources` pasa a devolver tres ranuras y rellena con `null`, no
con el packshot. El estado de la foto grande arranca en `null`
(mostrar `images.packshot`). El índice de una miniatura con URL la
muestra; repetir el clic vuelve a `null`. Una ranura `null` es
`Packshot` dentro de un `div`, sin `button` y sin `aria-pressed`.

## 5 · Relacionados

`Related` deja de retornar `null`. Siempre renderiza el `section` y el
`h2` (`font-display text-[clamp(26px,3vw,38px)] font-normal`).

Si `products.length === 0`, un párrafo `product.relatedEmpty`:
«Todavía no hay sugerencias.» / «Nothing to suggest yet.» A 13.5px,
`text-text-muted`, alineado a la izquierda, como el vacío de pedidos
de la cuenta. Sin lista y sin enlace.

Si hay filas, un `ul` con `aria-label={product.relatedList}` y la grilla
del artefacto. Cada `li` enlaza a `/catalogo/[slug]` con `Link`. La
foto es `Packshot` a `3 / 3.5`. El nombre es display 19px. El precio es
`formatPrice` a 14px `text-text-muted`. No se monta `ProductCard`: esa
tarjeta tiene marca, notas y «Agregar», y el artefacto no.

La página no mira `API_MODE`. No aparece otra llamada además de las
dos que ya hace.

## 6 · Copy

Claves nuevas o reescritas. El inglés es el del diccionario del
artefacto, no una traducción libre.

| Clave | es | en |
|-------|----|----|
| `product.installments` | Hasta 3 cuotas sin interés | Up to 3 interest-free instalments |
| `product.askThis` | Consultar este perfume | Ask about this perfume |
| `whatsapp.thisPerfume` | Hola! Consulta por {name} | Hi! A question about {name} |
| `product.descriptionBody` | el párrafo de caja y celofán | el párrafo «Tested by our team…» |
| `product.shipping` | Envíos y retiro | Shipping and pickup |
| `product.shippingBody` | el párrafo de Correo Argentino y Franklin | el párrafo «Shipped via Correo Argentino…» |
| `product.returns` | Cambios y devoluciones | Exchanges and returns |
| `product.returnsBody` | el párrafo de los 10 días | el párrafo «Exchanges within 10 days…» |
| `product.relatedEmpty` | Todavía no hay sugerencias. | Nothing to suggest yet. |

`product.description` sigue siendo el título del panel. El cuerpo pasa
a `descriptionBody`. `product.related` no cambia.

## 7 · Tests

Vitest de `web`, con `--no-deps`. El E2E de `product.spec.ts` corre
contra fixtures: Bharara tiene notas y parientes, así que la pirámide
y la lista siguen ahí. El vacío de relacionados no se afirma en
Playwright.

| AC | Dónde |
|----|--------|
| 1 | `product-intro`: un `h1` con el nombre y la descripción del fixture. La miga se afirma en el mismo componente (Inicio y Catálogo son links; el nombre no) |
| 2 | `product-intro`: kicker «Bharara · Ámbar & especias». Sin marca y sin familia, el kicker no está. Familia `""` no imprime el slug |
| 3 | `gallerySources` con packshot `/a` y una miniatura `/b` devuelve `["/b", null, null]`. El clic en la miniatura cambia la foto grande; el segundo clic vuelve a `/a`. La ranura vacía no es botón |
| 4 | `purchase-block`: fixture en stock sigue agregando y dice «En stock» sin `text-success`. Un producto con `stock: null` no dice «En stock» y el enlace «Consultar este perfume» apunta a `wa.me/5491168692694`. `stock: 0` sigue sin el botón de agregar |
| 5 | La pirámide vacía no está en el documento (test que ya existe). `spec-table` con el fixture muestra concentración y «100 ml», y no muestra «Ficha técnica», «Duración» ni «SKU». Con concentración `""` y `size: null`, el documento queda vacío |
| 6 | `details-accordion`: los tres botones `aria-expanded="false"`. Al abrir Descripción, el texto es el de celofán y no incluye la descripción del fixture |
| 7 | `related`: `[]` muestra el `h2` y «Todavía no hay sugerencias.» y no hay `list`. Con dos productos hay lista, nombre y precio, y no está el botón «Agregar». Un grep de `page.tsx` sigue en las dos llamadas al repositorio y no nombra `API_MODE` |
| 8 | Cubre el caso del kicker vacío (AC-2) más el render de intro con descripción y precio en purchase. El 404 no se reescribe: ya lo da `getProduct` en null |

El test de galería que hoy espera tres botones «Vista N» para Bharara
(todo `null`) se reescribe: sin URL no hay botón. El de
`gallerySources` que espera el packshot repetido se reemplaza por el
de AC-3. No se baja una aserción para que el caso nuevo pase: se cambia
el comportamiento que la spec pide cambiar.

`npm run verify` de `web` es el gate. `api/` no entra.

## 8 · Riesgos

- El E2E de touch mide la miga. Sin `min-h-11` en esos enlaces falla a
  360px. El plan ya los pide.
- El cuerpo de «Cambios y devoluciones» promete 10 días. Es el texto
  del artefacto, no una regla nueva de la API. Si el negocio no lo
  sostiene, se cambia el diccionario, no el layout.
- La primera foto no está en las miniaturas. Volver a ella es el
  segundo clic sobre la miniatura activa. Si eso se siente oculto, el
  ajuste es de interacción y no pide otro dato.
- Una URL firmada de la foto vence a la hora, igual que en el catálogo.
  Recargar la ficha pide otra.
- En `http` la sección de relacionados se ve vacía a propósito. No es
  un fallo del GET del producto.
