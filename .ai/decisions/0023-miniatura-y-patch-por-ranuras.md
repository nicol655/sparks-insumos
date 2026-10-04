# ADR 0023: Miniatura firmada y PATCH de fotos por ranura

- **Status:** accepted
- **Date:** 2026-09-29
- **Deciders:** producto (pedido de `/plan` de 016)

## Context

[016](../specs/016-edicion-producto/spec.md) pide ver la foto en el
listado, editar con el cajón de 015 y cambiar una foto sin reenviar las
otras. El bucket es privado (ADR-0018). El listado de 013 devuelve
claves, no URLs. [ADR-0019](0019-catalogo-backoffice-proxy-y-campos.md)
dejó la celda sin `<img>` porque no había lectura.

El `PATCH` de 013, si recibe `photos`, reemplaza la lista entera y
borra las claves anteriores. Omitir `photos` no borra ninguna. No hay
`PUT`.

El navegador no puede mandar el bearer en un `<img>` (ADR-0014: no va
en cookie ni en la query). Las ranuras no tienen rol en la base: el
orden es el único rastro (ADR-0022).

## Decision

- La lectura de un producto agrega `photo_urls`, una URL por clave, en
  el mismo orden. No se guarda. `to_audit` la omite. La miniatura usa
  `photo_urls[0]`. El cajón de edición usa el resto para el preview.
- La URL es un GET firmado de S3, una hora, armado con el mismo cliente
  boto3. El doble de memoria devuelve `memory:{clave}`. Si firmar falla,
  esa entrada es `""` y el listado no responde 502: la celda vuelve a
  la franja.
- No se agrega `PUT`. El parcial sigue siendo `PATCH`. La fila manda
  sólo `visibility`. `visible` pasa a `hidden`; `hidden` y `not_listed`
  pasan a `visible`.
- El cajón de edición manda `photo_slots=1` y, por índice `0..7`,
  `slot_key_i` (clave que se queda) o `slot_file_i` (archivo nuevo).
  Un índice vacío no se manda. El archivo gana si vienen los dos. La
  lista nueva es ese resultado, en orden, sin huecos. Las claves de la
  fila que no quedan se borran después del commit. Si el commit falla,
  se borran las recién subidas y las viejas siguen.
- Cero ranuras ocupadas con `photo_slots` es 422 `photos_rejected`. No
  hay `put` ni `delete`. Una clave que no está en la fila, o repetida,
  es el mismo 422.
- Sin `photo_slots`, el `PATCH` de 013 no cambia: omitir archivos deja
  la lista; mandar `photos` la reemplaza. El `POST` tampoco cambia.
- El panel, si hay más de cuatro fotos, reenvía las de índice `4..7`
  como `slot_key_*` para no borrarlas. El cajón sólo pinta cuatro.
- La papelera y el reemplazo son estado del cajón. S3 cambia al `PATCH`
  exitoso. Cancelar no llama a la API.

## Alternatives considered

- **`<img src={clave}>`.** La clave no es una URL y el bucket no es
  público.
- **Proxy de bytes en el `<img>`.** El tag no puede mandar
  `Authorization` ni `x-sparks-token`. Habría que poner el bearer en la
  query o en una cookie. ADR-0014 lo prohíbe.
- **`PUT` con el producto entero.** El usuario dijo patch o put. El
  `PATCH` ya aplica sólo los campos presentes. Un `PUT` obligaría a
  reenviar todo para cambiar Publicado.
- **Reemplazar la lista cada vez que cambia una ranura.** Hay que
  volver a subir las fotos que se quedan, y el panel sólo tiene la
  clave, no los bytes.
- **Borrar en S3 al clicar la papelera.** Cancelar el cajón no podría
  deshacer, y un 422 posterior dejaría el producto sin esa foto igual.

## Consequences

- ADR-0019 sigue vigente para el proxy y los campos que no se guardan.
  Deja de cumplirse la frase «el operador no ve la imagen»: la ve por
  la URL firmada.
- Hace falta `s3:GetObject` sobre el bucket de desarrollo. La policy
  `sparks-dev-s3-police` v2 ya lo incluye.
- Una pestaña abierta más de una hora muestra la franja hasta que el
  listado se vuelve a pedir. No hay un timer de refresco.
- Quien llame al `PATCH` con `photo_slots` y omita una clave la borra.
  El panel no omite las fotos que no pinta.
