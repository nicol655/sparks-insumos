# ADR 0019: El catálogo del panel escribe el contrato de 013, por un proxy propio

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** producto (pedido de `/plan` de 014)

## Context

014 pide el listado y el alta de productos en el backoffice, con el
artefacto `NtzZJG94zfZrj3LpMvAtS9` como única fuente visual, y a la vez
un input por cada campo que llena la base. Esos dos pedidos no coinciden.

El artefacto (constitución 17, `business-model.md`) describe categoría
Perfume / Set / Body splash, familia, Para, stock, Publicado o borrador,
texto en español y en inglés, pirámide, y fotos con rol. 013 guarda
otros campos: costo, precio, `digital` o `physical`, medidas, sku,
código de barras, marca, `visible` / `hidden` / `not_listed`, descuento
sin aplicar, claves de foto, una categoría con nombre libre y tags.

El navegador no puede llamar a `http://api:8000`: no hay CORS y el
hostname `api` sólo existe en la red de Docker. El bearer está en
`sessionStorage` (ADR-0014). Una server action no lo ve sola. El login
ya lo resuelve con una action porque todavía no hay token. Acá el token
ya está en el cliente.

Un test contra el API encendido escribiría en la base `sparks` y
subiría la foto a S3, o fallaría con 502 si no hay credenciales.

## Decision

- La pantalla lista y crea lo que 013 ya expone. No se agregan columnas
  para stock, familia, Para, pirámide, descripción en inglés ni rol de
  la foto. No se pintan vacías.
- La visibilidad se etiqueta Publicado (`visible`), Borrador (`hidden`)
  y No listado (`not_listed`). El tercer valor se muestra aunque el
  artefacto sólo nombre dos.
- La categoría no es un enum. El alta elige una fila de
  `product_categories` y puede crear el nombre (Perfume, Set, Body
  splash u otro) en la misma pantalla. El tag, igual, y es opcional.
- El listado no usa `<img>` con la clave. Muestra cuántas fotos hay.
- El navegador llama a `/api/catalog/products`,
  `/api/catalog/product-categories` y `/api/catalog/tags` en el
  backoffice. Esas rutas reenvían a `API_BASE_URL` con el
  `Authorization` que mandó el cliente. No hay proxy genérico.
- El formulario valida antes de enviar. La API sigue respondiendo 422
  si el cuerpo igual llega incompleto. No se agrega otro validador en
  FastAPI.
- El test de integración del cliente habla con un HTTP de loopback
  dentro de Vitest. No toca `sparks` ni AWS. El 422 y el 201 reales
  siguen en el pytest de 013.

## Alternatives considered

- **Dibujar el catálogo del artefacto y dejar los campos de 013 para
  después.** El pedido pide los inputs de la base en esta rebanada. Un
  formulario de stock y pirámide no tendría dónde guardarse.
- **Agregar esas columnas ahora.** Cambia 013, la migración y la
  auditoría, y el pedido no las nombró. Quedan fuera hasta una spec
  propia.
- **Fetch del navegador a `API_BASE_URL`.** El browser no resuelve `api`
  y habría que abrir CORS para un origen que guarda el bearer.
- **Server action que recibe el token en el argumento.** El login ya
  usa actions, pero `next dev` deja el argumento en el log. El header
  `Authorization` hacia el propio origen no entra en ese log. La action
  tampoco simplifica el multipart.
- **Proxy `[...path]`.** Menos archivos, y también un reenvío abierto
  a cualquier ruta de la API. Con tres recursos alcanza.
- **Vitest contra el contenedor `api`.** Contamina `sparks` y depende
  de AWS para la foto. El loopback más el pytest de 013 cubren el
  contrato sin eso.
- **URL firmada para mostrar la foto.** Hace falta un endpoint de
  lectura que 013 no tiene. No se inventa en esta pantalla.

## Consequences

- Familia y tamaño no se guardan en esta decisión.
  [0024](0024-lectura-publica-y-filtros.md) los agrega porque la
  vidriera filtra por esos dos ejes. Para, stock, pirámide y la
  descripción en inglés siguen fuera.
- El operador no ve la imagen, sólo la cantidad, hasta que exista una
  URL de lectura.
- El badge `5` de Catálogo desaparece. Los otros conteos del menú
  siguen siendo los de 011.
- Cualquier cuenta con la clave cambiada puede crear productos. El rol
  de Administración sigue sin existir.
- Hasta 017, `web/` no leía estos productos. La vidriera los lee
  según [0024](0024-lectura-publica-y-filtros.md).
