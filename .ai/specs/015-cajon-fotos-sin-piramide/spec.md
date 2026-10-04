# 015 · Cajón de producto: sin pirámide, fotos por ranura

- **Estado:** aprobada (pedido de `/plan`, 2026-09-29)
- **Fecha:** 2026-09-29
- **Padre:** [014](../014-catalogo-backoffice/spec.md) y
  [ADR-0021](../../decisions/0021-catalogo-layout-del-artefacto.md) dejan
  el cajón «Nuevo producto». Esta spec sólo cambia la pirámide y las
  fotos de ese cajón. El `POST` sigue siendo el de
  [013](../013-productos/spec.md).

## Problema

El cajón muestra «Pirámide olfativa» con Salida, Corazón y Fondo. Esos
tres textos no se guardan. También muestra cuatro cuadros (Packshot
frontal, Atomizador, Notas, Lifestyle) que no eligen archivo: debajo
hay un selector del sistema, «Choose Files», que sí carga las fotos.

El operador tiene que usar el cuadro como selector, ver la imagen ahí
mismo y leer el nombre del archivo debajo, sin perder la extensión si
el nombre no entra.

## Objetivo

Sacar la pirámide del cajón. Cada cuadro abre el selector de imágenes
del sistema, muestra la foto elegida y, debajo, el nombre del archivo.
Un nombre que no entra en el cuadro se corta y conserva la extensión.

## Alcance

### Dentro

1. Quitar el grupo «Pirámide olfativa» y los inputs Salida, Corazón y
   Fondo.
2. Cada cuadro es el control de una sola imagen: cursor pointer, clic
   abre el selector del sistema.
3. Con archivo elegido, el cuadro muestra esa imagen. Debajo, el nombre.
4. Si el nombre no entra, se ve el comienzo, `...`, un espacio y la
   extensión. Ejemplo:
   `nombre_muy_largo_para_el_cuadro.png` → `nombre_mu... .png`.
5. Esas fotos, en el orden de los cuadros y sin las ranuras vacías,
   siguen siendo el `photos` del alta de 013.

### Fuera

- Guardar salida, corazón, fondo o el rol de cada foto. 013 no tiene
  esas columnas.
- Un quinto archivo, drag-and-drop, ni un botón para borrar la foto.
- Editar un producto ya creado.
- La vidriera, el listado y el resto de grupos del cajón (identidad,
  clasificación, precio, medidas, categoría, tag).
- Cambiar el tope de 8 fotos de la API. Esta pantalla sólo puede mandar
  hasta cuatro, una por cuadro.

## Qué se ve

El grupo «Pirámide olfativa» no está.

«Imágenes» sigue con los cuatro cuadros, en este orden: Packshot
frontal, Atomizador, Notas, Lifestyle. El cuadro vacío muestra ese
nombre, como ahora. El puntero sobre el cuadro es pointer.

Un clic abre el selector de una imagen (JPEG, PNG o WebP, igual que
hoy). Al elegir:

- el cuadro muestra la imagen, recortada al marco 4:5;
- debajo del cuadro, no adentro, está el nombre del archivo;
- volver a cliquear el mismo cuadro reemplaza esa imagen y ese nombre.

El selector suelto («Choose Files») no se muestra. La frase que invita
a arrastrar fotos tampoco: ya no hay dónde arrastrar.

Un nombre que entra en el ancho del cuadro se ve entero
(`perfume 1.webp`). Uno que no entra se corta así: se conserva el
inicio del nombre, después `...`, un espacio y la extensión completa,
como en el ejemplo de arriba. El nombre entero sigue disponible en el
`title` del texto cortado.

Hace falta al menos una foto para guardar, como en 014. Tipo y tamaño
siguen el mensaje de 013. Una ranura vacía no se envía. El orden del
multipart es el de los cuadros, de izquierda a derecha.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como operador no veo la pirámide olfativa en el alta |
| US-2 | P0 | Como operador elijo la foto desde el cuadro y la veo ahí |
| US-3 | P0 | Si el archivo tiene un nombre largo, leo el inicio y la extensión |

## Criterios de aceptación

1. El cajón no muestra «Pirámide olfativa», «Salida», «Corazón» ni
   «Fondo».
2. Cada cuadro tiene cursor pointer. Elegir un archivo en «Packshot
   frontal» no llena los otros tres.
3. Tras elegir una imagen, ese cuadro muestra un preview y, debajo, el
   nombre. `perfume 1.webp` se lee completo.
4. `nombre_muy_largo_para_el_cuadro.png` se muestra
   `nombre_mu... .png`. La extensión no se pierde.
5. Esas fotos salen en `createProduct` en el orden de los cuadros,
   salteando las vacías. El cuerpo no agrega campos de pirámide ni de
   rol.
6. Cero fotos sigue sin llamar al cliente. Un archivo que no es JPEG,
   PNG o WebP, o de más de 5 MB, sigue mostrando el texto de 013.
7. `web/` y `api/` no cambian.
