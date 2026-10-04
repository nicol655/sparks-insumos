# ADR 0016: El cascarón pinta texto fijo y no finge un servicio

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** producto (pedido de `/plan` de 011)

## Context

011 pide el menú, el encabezado, el resumen y los ajustes del artefacto
`NtzZJG94zfZrj3LpMvAtS9`. La misma pedido dice que el texto alcanza y que
las llamadas al servicio van en otra tarea. La maqueta, en cambio, calcula
ventas, filtra la búsqueda y guarda ajustes en memoria.

010 dejó `/dashboard` vacío a propósito (RF-7). El principio 17 prohíbe
tratar las filas de la maqueta como datos vivos. El principio 11 prohíbe
publicar el CBU de relleno.

## Decision

Resumen y ajustes renderizan constantes. No hay repositorio, no hay
`fetch` nuevo y no hay función que reduzca la serie de ventas. Los
controles 7D y 30D se ven y no cambian las cifras. «Guardar ajustes» no
persiste.

La búsqueda es un campo. No abre resultados.

El enlace «Ver tienda» usa `NEXT_PUBLIC_STORE_URL`, con default
`http://localhost:3000` (el `WEB_PORT` del stack). No se copia el href
`Sparks Perfumes.dc.html`.

Las filas, el CBU y «Martina Álvarez» son copy de esta pantalla. No se
siembran en `api/` ni se muestran en `web/`.

## Alternatives considered

- **Un fixture con la serie `SALES` y el recálculo de 7/14/30.** Es un
  servicio de mentira. El pedido lo descartó.
- **Dejar `/dashboard` vacío y montar el cascarón en otra ruta.** 010
  manda el login a `/dashboard`. Dos hogares.
- **Apuntar «Ver tienda» a sparksinsumos.com.** Esa es la Tiendanube que
  este repo reemplaza. El botón del panel tiene que abrir el storefront
  del stack.

## Consequences

011 reemplaza el panel en blanco de 010. La spec que conecte los datos
sustituye las constantes por respuestas de `api/`; hasta entonces los
tests afirman las cadenas. La matriz de roles no se aplica en este
cascarón.
