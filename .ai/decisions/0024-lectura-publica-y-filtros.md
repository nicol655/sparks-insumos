# ADR 0024: Lectura pública del catálogo y filtros en el GET

- **Status:** accepted
- **Date:** 2026-09-30
- **Deciders:** producto (pedido de `/plan` de 017)

## Context

017 pide que `/catalogo` muestre lo cargado en el panel, que familia,
marca, tamaño, precio, nombre y el orden se resuelvan sólo en el GET,
y que `GET /products` y `GET /products/{id}` no exijan sesión.

Esos GET hoy pasan por `require_password_changed` y por `audited`.
Sin `user_id`, el decorator responde 401 aunque la ruta no pida
sesión: el código no cumple la frase de
[ADR-0017](0017-auditoria-opt-in-y-contexto.md) («sin user_id, no
inserta»).

[ADR-0019](0019-catalogo-backoffice-proxy-y-campos.md) dejó familia y
tamaño fuera de la tabla. La URL de la vidriera ya filtra por esos
dos ejes (`family`, `size` en mililitros). Sin columnas, el backend
no puede aplicarlos.

[ADR-0003](0003-capa-de-datos-desacoplada.md) dice que `api/` debe
cumplir `web/src/lib/api/contract.ts` tal cual. 013 no lo cumple: no
hay slug, notas, stock ni concentración. Inventarlos para calzar el
Zod mostraría notas y un agotado falsos (constitución 17, el mismo
criterio que ADR-0013).

El select del panel dice `ambar`, `floral`, `madera`, `fresco`. La
vidriera filtra `ambar-especias`, `florales`, `gourmand`, `maderas`.
No son el mismo vocabulario.

## Decision

- Los dos GET no exigen bearer. Sin bearer, sólo entra `visibility =
  visible`. Un id que no es visible responde 404, no 403. Con bearer
  de operador el listado y el detalle siguen como en 013, más
  `family` y `size_ml`.
- El JSON anónimo no incluye `cost`, `sku`, `bar_code`, `discount`,
  `weight`, `length`, `width` ni `height`. El del operador sí.
- `audited(..., public=True)` en esos dos GET: si no hay actor, no
  inserta y no responde 401. Con actor, la fila `read` se escribe
  igual. El resto de las rutas no cambia.
- Se agregan `products.family` (slug o null) y `products.size_ml`
  (entero positivo o null). En el alta y el `PATCH` del panel son
  obligatorios. En la API, null sigue aceptado para no romper filas
  ya guardadas ni los tests de 013 que no los mandan. Un slug que no
  sea uno de los cuatro, o un tamaño que no sea entero positivo,
  es 422.
- Los cuatro slugs son los de `web/src/lib/catalog/families.ts`. El
  select del panel usa esos valores. «Fresco & acuático» no se
  guarda: no hay chip que lo filtre.
- `q` es subcadena del nombre, sin mayúsculas ni acentos. No mira
  marca, familia ni notas. El precio del filtro es `price`, no el
  costo y no el precio con `discount`.
- El orden público es `name-asc` (default), `name-desc`, `price-asc`,
  `price-desc`. `relevance` sale del select: ordenaba por stock, y
  stock no se persiste.
- La vidriera no habla el JSON de 013 en los componentes. El
  `http-repository` lo mapea al contrato. Notas vacías, stock null,
  concentración vacía. La tarjeta y la pirámide no pintan huecos
  inventados. El slug del link es el id.
- Para, stock, pirámide y la descripción en inglés siguen fuera de
  la tabla. ADR-0019 queda acotado sólo en familia y tamaño.

## Alternatives considered

- **Dejar familia y tamaño sólo en el cliente.** Contradice el pedido:
  el filtro tiene que ser el GET.
- **Tratar la categoría libre como familia.** El operador puede
  nombrarla «Perfume». No es un slug olfativo.
- **Un segundo recurso `/store/products`.** Dos listas que se desfasan.
  El pedido nombra el GET que ya existe.
- **El mismo JSON con y sin bearer, incluido el costo.** Cualquiera
  con la URL lee el costo. El anónimo no lo necesita.
- **Rellenar notas y stock para no tocar el Zod.** La tarjeta
  mentiría. Se afloja el contrato en esos campos y la UI los omite.
- **Auditar cada vista anónima.** No hay actor, y 012 no pidió auditar
  el escaparate.

## Consequences

- Un borrador no se filtra por la tienda. El panel, con bearer, sí lo
  ve.
- `prueba 1` y cualquier fila anterior salen sin familia ni tamaño
  hasta que se editen. Entran al listado sólo cuando ese filtro no
  está puesto.
- Más de 100 publicados no entran en un GET: el tope de 013 no se
  sube acá.
- El overlay de búsqueda, al pasar a `http`, encuentra nombres y deja
  de encontrar una nota como «vainilla».
- Los relacionados de la ficha quedan vacíos en `http`. Desde
  [0025](0025-ficha-sin-datos-inventados.md) la sección se muestra con
  empty state.
