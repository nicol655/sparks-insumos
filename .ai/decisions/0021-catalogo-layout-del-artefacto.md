# ADR 0021: El catálogo del panel usa el layout del artefacto

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** producto (pedido de alinear Catálogo al artefacto)

## Context

014 y [ADR-0019](0019-catalogo-backoffice-proxy-y-campos.md) listan y
crean lo que guarda 013. La pantalla salió como una tabla de seis
columnas y un formulario de página, no como el catálogo del artefacto
`NtzZJG94zfZrj3LpMvAtS9`: filtros, grilla (Producto, Familia, Tamaño,
Precio, Stock, Publicado) y cajón de alta.

El artefacto sigue siendo la única fuente visual (constitución 17).
Esas columnas de más no existen en 013. Pintarlas con números o con las
filas de la maqueta las haría pasar por datos vivos.

## Decision

- `/catalogo` y `/catalogo/nuevo` copian el layout, la tipografía y los
  textos del artefacto.
- Lo que 013 devuelve se muestra ahí: nombre, marca o `—`, categoría,
  precio en ARS, etiqueta de visibilidad, cantidad de fotos.
- Familia, tamaño y stock se ven como `—`. Los controles de stock no
  escriben. Etiqueta, familia olfativa, Para, tamaño, unidades,
  pirámide y la descripción en inglés están en el alta y no salen en el
  `POST`.
- No se siembran las filas de ejemplo. El alta sigue mandando sólo el
  contrato de 013, fotos incluidas.
- «No listado» sigue en el select. El artefacto sólo nombra Publicado y
  Borrador.

## Alternatives considered

- **Dejar la tabla de 014.** No coincide con el artefacto, que es la
  fuente visual pedida.
- **Guardar familia, stock y pirámide ya.** Cambia 013, la migración y
  la auditoría. Sigue fuera hasta una spec propia.
- **Ocultar otra vez esas columnas.** El layout deja de ser el del
  artefacto.

## Consequences

- Un operador puede completar familia o stock y, al guardar, esos
  valores no quedan. La ficha de edición sigue fuera.
- El antetítulo dice «0 con stock bajo» hasta que exista la columna.
- ADR-0019 sigue vigente para el proxy y para el cuerpo del alta.
