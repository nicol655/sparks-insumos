# 016 · Edición de producto, miniatura y visibilidad

- **Estado:** aprobada (pedido de `/plan`, 2026-09-29)
- **Fecha:** 2026-09-29
- **Padre:** [013](../013-productos/spec.md),
  [014](../014-catalogo-backoffice/spec.md) y
  [015](../015-cajon-fotos-sin-piramide/spec.md). El alta sigue el cajón
  de 015. Esta spec agrega la edición, la miniatura del listado y el
  cambio de «Publicado» en la fila.

## Problema

La celda de foto es una franja vacía. «Editar» es texto: no abre nada.
El control de Publicado no llama a la API. El `PATCH /products/{id}`
de 013 ya existe, pero el panel no lo usa, y mandar archivos reemplaza
la lista entera: no se puede cambiar una foto y dejar las otras.

## Objetivo

Ver la primera foto en la fila. Editar abre el mismo cajón, con los
datos guardados, y guarda con `PATCH`. El control Publicado cambia sólo
la visibilidad. En la edición, reemplazar una foto borra la anterior
del bucket al guardar, y la papelera quita una foto sin subir otra.
Cero fotos no se puede guardar, ni en el alta ni en la edición.

## Alcance

### Dentro

1. La celda de foto muestra la primera imagen del producto. Si no hay
   URL de lectura, queda la franja de ahora.
2. «Editar» es un botón con cursor pointer y un hover visible. El clic
   abre el cajón de alta con los campos que 013 guarda ya completados,
   y el envío llama a `PATCH /products/{id}`.
3. El control de la columna Publicado tiene cursor pointer. El clic
   llama a ese mismo `PATCH` y manda sólo `visibility`.
4. En el cajón de edición, clicar una foto ya subida abre el selector.
   Al elegir archivo, esa foto queda marcada para borrarse del bucket
   y la nueva ocupa su lugar. El borrado ocurre al guardar, no al
   elegir.
5. Con el puntero sobre una foto del cajón de edición aparece un botón
   con icono de papelera y cursor pointer. Quitarla no abre el selector
   y no sube otra. Tampoco borra en el bucket hasta guardar. Cancelar
   no borra nada.
6. Guardar un producto con cero fotos responde 422
   `photos_rejected`, en el `POST` y en el `PATCH` de ranuras. No inserta,
   no modifica la fila y no borra objetos que ya estaban.

### Fuera

- Un método `PUT`. El parcial ya es `PATCH`.
- Persistir familia, tamaño, stock, descripción en inglés, pirámide o
  el rol de la foto. Esos campos se ven como en 014 y 015 y siguen sin
  guardarse. En la edición no se inventa un valor para ellos.
- Conectar la vidriera. `web/src/lib/api/contract.ts` no cambia.
- Roles de operador. Sigue valiendo la constitución 14: cualquier
  cuenta con la clave ya cambiada.
- Borrar el producto, reordenar fotos arrastrando, o una quinta ranura
  visible. Si el producto tiene más de cuatro fotos, las que pasan de
  la cuarta se conservan al guardar; esta pantalla no las edita.
- Hacer público el bucket.

## Qué se ve

La celda de foto de cada fila es un `<img>` de la primera foto, en el
mismo marco de ahora (40×48). `alt=""`. Si esa URL no viene, se ve la
franja rayada.

«Editar» se puede clicar. El puntero es pointer y el hover subraya el
texto. El cajón es el de «Nuevo producto», con el kicker «Editar
producto» y el botón «Guardar cambios». Los inputs de 013 salen con el
valor guardado: nombre, marca, descripción, categoría, tags, tipo,
precio, costo, visibilidad, descuento, medidas, SKU y código de barras.
Las fotos ocupan las ranuras en el orden de `photos` (la primera es
Packshot frontal). Familia, tamaño, stock y la descripción en inglés
siguen vacíos.

El control Publicado es un botón. Si el producto está `visible`, el
clic lo pasa a `hidden`. Si está `hidden` o `not_listed`, el clic lo
pasa a `visible`. La etiqueta sigue siendo Publicado, Borrador o No
listado. Un fallo deja la fila como estaba.

En la edición, la papelera sólo se ve al pasar el puntero sobre una
foto (o al enfocar ese botón). El alta no gana papelera: 015 sigue
igual, y el `POST` sin fotos ya responde 422.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como operador veo la miniatura de la primera foto en el listado |
| US-2 | P0 | Como operador abro Editar, veo los datos guardados y los corrijo |
| US-3 | P0 | Como operador cambio Publicado desde la fila, sin tocar el resto |
| US-4 | P0 | Como operador reemplazo o quito una foto, y no puedo dejar el producto sin ninguna |

## Criterios de aceptación

1. Una fila con `photo_urls[0]` muestra un `img` con ese `src`. Sin esa
   URL, la celda sigue siendo la franja, sin `img`.
2. «Editar» tiene `cursor-pointer` y un hover que subraya. El clic abre
   el cajón con el nombre, el precio y la visibilidad de esa fila, y el
   kicker «Editar producto».
3. Guardar ese cajón llama a `updateProduct` con el id y no llama a
   `createProduct`. El cuerpo lleva los campos editados.
4. El control Publicado tiene `cursor-pointer`. El clic de una fila
   `visible` llama al `PATCH` sólo con `visibility=hidden`. El clic de
   una fila `hidden` o `not_listed` manda sólo `visibility=visible`.
5. En la edición, elegir un archivo sobre una foto ya subida deja esa
   clave fuera del guardado y manda el archivo en esa ranura. La
   papelera vacía la ranura y no abre el selector. Cancelar no llama al
   `PATCH`.
6. Guardar la edición con todas las ranuras vacías y sin fotos de cola
   no llama al cliente y muestra el aviso de fotos. El `PATCH` con
   `photo_slots` y cero fotos responde 422 `photos_rejected`, no cambia
   la fila y no borra las claves viejas. El `POST` sin fotos sigue en
   422 y no inserta.
7. `web/` no cambia. El bearer no viaja en la query ni en una cookie.
