# ADR 0018: Dinero numérico, fotos detrás de un puerto, uuid en la API

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** producto (pedido de `/plan` de 013)

## Context

013 pide `cost` y `price` como float, fotos en un bucket S3 nuevo, y
una categoría con uuid y con id entero a la vez. El contrato de la
vidriera (`web/src/lib/api/contract.ts`, ADR-0003) no es este recurso:
ahí el precio es un entero en ARS y la foto es packshot más tres
miniaturas. Esta rebanada no lo cambia.

Un float de IEEE no guarda `1200.10` exacto. Subir a AWS desde pytest
haría el gate dependiente de la red y de una clave. Y el resto de la
API ya identifica las filas con uuid.

## Decision

- `cost` y `price` son `numeric(12, 2)`, mayores o iguales a cero. La
  columna no es float. En el JSON salen como número con dos decimales.
  `weight`, `length`, `width` y `height`, si vienen, usan el mismo
  numérico y pueden ser null.
- Las fotos se guardan como lista ordenada de claves en `products.photos`
  (jsonb). Un puerto `ObjectStorage` sube y borra. La implementación
  real usa boto3, fuera del event loop. Los tests reciben un doble en
  memoria. Pytest no abre AWS.
- El bucket no se crea al bootear la API ni desde el repo. Ya existe
  fuera. El proceso de la API sólo pone y borra objetos. Nombre, región
  y claves salen de `api/.env` (`AWS_S3_BUCKET`, `AWS_REGION`,
  `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). Compose carga ese
  fichero con `env_file` y no declara esas variables vacías: una vacía
  en el entorno pisa el fichero y boto3 no ve la clave. Ninguna va al
  repo.
- `product_categories.id` es el serial que usan las FK.
  `product_categories.uuid` es el id del JSON y de la URL. El cliente
  manda ese uuid en `category_id` y en el padre `product_category_id`.
  La ruta lo resuelve al entero. El serial no viaja en la respuesta.

## Alternatives considered

- **Columna float, como dice el pedido.** `1200.10` no sobrevive el
  round-trip. El numérico cumple el mismo dato con exactitud de
  centavos.
- **Entero en pesos, como el contrato de la vidriera.** El pedido
  distingue costo y precio y no dice que sean pesos enteros. El
  numérico admite centavos sin tocar `contract.ts`.
- **boto3 directo en la ruta, y el bucket de verdad en pytest.** El
  gate dejaría de ser determinista. El puerto es la pieza que 013
  puede probar.
- **Crear el bucket en el lifespan de FastAPI.** La clave de runtime
  tendría permiso de administración. Peor privilegio, y un arranque
  que depende de AWS.
- **Exponer el serial en el JSON.** Choca con users, sessions y
  audits, que ya son uuid. El serial queda para la FK, que es lo que
  el pedido pide.

## Consequences

- Hace falta boto3, y `python-multipart` porque FastAPI no lee
  `Form` ni archivos sin esa librería. Las dos se agregan con uv dentro
  del contenedor, no con una versión escrita a mano.
- Entre el upload y el commit puede quedar un objeto huérfano si la
  base falla después. Se acepta. No hay transacción que cubra S3.
- La vidriera no puede leer este JSON sin una spec de mapeo. ADR-0003
  sigue vigente para `web/`.
- Un operador de verdad todavía no existe. Cualquier cuenta con la
  clave ya cambiada administra el catálogo hasta la spec de roles.
