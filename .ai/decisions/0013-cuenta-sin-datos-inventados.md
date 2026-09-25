# ADR 0013: La cuenta no inventa datos que la API no devuelve

- **Status:** accepted
- **Date:** 2026-09-25
- **Deciders:** producto (pedido de fidelidad de `/cuenta`)

## Context

El prototipo de `/cuenta` muestra Nivel «Club 5%», Cupón activo «VIP15»,
Pedidos «07» y tres filas (`SP-10412`, `SP-10388`, `SP-10301`).
`GET /me` no devuelve nivel, cupón ni pedidos. 008 decidió no dibujar
ese bloque y poner en su lugar correo, teléfono y fecha de alta.

El prototipo vuelve a ser la fuente visual. Esos tres valores siguen
sin existir en la API. Inventarlos desmiente el estado real de la socia
y choca con la constitución: un cupón no se inventa (principio 9).

## Decision

La cuenta dibuja las tres fichas y el título «Tus pedidos». El valor de
cada ficha es `-` hasta que una respuesta de la API lo traiga. El
listado no tiene filas: un empty state. No se llama a ningún endpoint
nuevo y no se hardcodea `Club 5%`, `VIP15`, `07` ni un id `SP-`.

El año de «Socia desde» no entra en esta regla: sale de `created_at`.

## Alternatives considered

- **Dejar las fichas de correo, teléfono y alta.** Fiel a 008, infiel al
  prototipo. El pedido de esta pasada es el prototipo.
- **Pintar los valores del prototipo como demo.** Se lee como un cupón
  y un historial que la persona no tiene.
- **Ocultar la ficha hasta tener el campo.** El prototipo tiene siempre
  tres fichas. El guion ocupa el lugar del dato sin afirmarlo.

## Consequences

008, decisión 5, queda reemplazada por esta ADR para el layout de la
cuenta. El drawer sigue mostrando correo, teléfono y el resto del
perfil. Cuando exista una API de nivel, cupón o pedidos, se sustituye
el `-` y el empty state; la fila del prototipo
(`1fr 2fr 1fr 1fr` desde 700px) se implementa en esa spec, no antes.
