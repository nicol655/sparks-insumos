# ADR 0022: Las fotos del cajón se eligen en la ranura, sin pirámide

- **Status:** accepted
- **Date:** 2026-09-29
- **Deciders:** producto (pedido de `/plan` sobre el cajón de alta)

## Context

[ADR-0021](0021-catalogo-layout-del-artefacto.md) dejó en el cajón la
pirámide y cuatro cuadros de foto porque el artefacto los muestra. La
pirámide no se envía. Los cuadros no eligen archivo: debajo hay un
`<input type="file" multiple>` que sí arma `photos`.

El pedido nuevo saca la pirámide y hace que cada cuadro abra el
selector, muestre la imagen y el nombre, y conserve la extensión si el
nombre no entra.

## Decision

- El grupo «Pirámide olfativa» sale del cajón. No se agrega columna.
- Cada ranura de `IMAGE_SLOTS` es un solo archivo. El input suelto y la
  frase de arrastrar salen. El cajón manda como máximo cuatro parts
  `photos`, en el orden de las ranuras, sin las vacías. El rol no viaja.
- El nombre largo lo corta `shortenFileName` a 17 caracteres:
  inicio, `...`, un espacio y la extensión. `text-overflow` sobre el
  nombre entero no sirve: se come la extensión. jsdom no mide el cuadro,
  así que el límite es ese presupuesto, no un `scrollWidth`.

## Alternatives considered

- **Dejar el input de «Choose Files» además de los cuadros.** Dos
  orígenes para el mismo `photos`. El pedido pone el selector en el
  cuadro.
- **Cortar con CSS el nombre completo.** La extensión desaparece cuando
  el texto no entra. El ejemplo la pide visible.
- **Medir el cuadro en el navegador.** El test no tiene layout. Un
  presupuesto fijo reproduce el ejemplo y entra en el ancho actual.
- **Guardar el rol o la pirámide.** Cambia 013. Sigue fuera.

## Consequences

- Un producto creado desde el cajón tiene entre 1 y 4 fotos, no hasta 8.
- El orden de los parts es el único rastro del cuadro de origen.
- La pirámide del artefacto deja de verse en el alta. ADR-0021 queda
  vigente para el resto del layout.
