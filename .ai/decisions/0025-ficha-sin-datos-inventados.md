# ADR 0025: La ficha calza el artefacto y no inventa el dato

- **Status:** accepted
- **Date:** 2026-09-30
- **Deciders:** producto (pedido de `/plan` de la ficha)

## Context

La pantalla `isProduct` del artefacto
`QUUhcHp24QBtXkUG8sHPDj` arma duración, estela, ocasión y SKU con
reglas del propio script (precio mayor a 30.000, familia `fresco`, el
id en mayúsculas). La concentración sale como «Eau de parfum» salvo que
el ítem sea un body splash. El stock dice siempre «En stock».

El GET público de [017](../specs/017-vidriera-catalogo/spec.md) no trae
notas, stock, concentración, duración ni SKU. [ADR-0013](0013-cuenta-sin-datos-inventados.md)
ya prohibió pintar valores de maqueta que la API no devuelve.
[ADR-0024](0024-lectura-publica-y-filtros.md) escondía «También te puede
gustar» cuando `getRelated` vuelve vacío. El pedido de esta ficha es
dejar la sección armada, con empty state, y no construir el endpoint.

El oro `#4CA455` a 10px que el artefacto usa para el stock mide 2.76:1
sobre el canvas. `StockBadge` ya lo resolvió en tinta.

## Decision

El layout es el de `isProduct`. Un hecho del producto sólo se imprime
si el contrato lo trae con valor. La celda que no tiene valor no se
renderiza: no va un guion ni una heurística del script.

La pirámide sigue oculta si las tres listas están vacías. La grilla de
datos sólo tiene concentración y tamaño, y sólo cuando vienen. El stock
usa `StockBadge` y se omite si `stock` es `null`.

«También te puede gustar» se monta siempre. Lista vacía: empty state.
No hay endpoint nuevo. `getRelated` en `http` sigue en `[]`. Eso
reemplaza la frase de ADR-0024 que escondía la sección.

El copy que no es un campo del producto (cuotas, acordeón, miga,
«Consultar este perfume») sale del diccionario del artefacto. Las
cuotas no cobran: es la misma frase que la home ya muestra. El `+` del
acordeón queda a 24px.

Los colores siguen siendo los tokens de `theme.css`. El artefacto usa
`#4A423B` y `#8A8073` en el mismo rol que `text-text-muted` y
`text-text-meta`. No se agrega un hex.

## Alternatives considered

- **Seguir el script del artefacto** y calcular duración según el
  precio. Se lee como un dato medido. El GET no lo midió.
- **Guion en cada celda vacía**, como la cuenta. Allá las tres fichas
  son fijas. Acá una celda vacía parece un dato en blanco.
- **Dejar la sección de relacionados oculta** (ADR-0024). El pedido es
  verla, vacía, hasta que exista el endpoint.
- **Pintar el stock en verde 10px.** Falla el contraste. `StockBadge`
  ya eligió tinta.

## Consequences

- Un producto de la API, sin notas ni stock, no muestra pirámide ni
  «En stock». Muestra nombre, descripción, precio, fotos y el tamaño
  si está guardado.
- Cuando el endpoint de relacionados exista, la sección ya tiene
  tarjetas. El cambio queda en el repositorio, no en el layout.
- El cuerpo del acordeón deja de ser la descripción del perfume. Esa
  descripción pasa a vivir bajo el `h1`.
