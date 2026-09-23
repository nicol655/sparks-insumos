# ADR 0003: Capa de datos desacoplada del backend futuro

- **Status:** accepted
- **Date:** 2026-09-22
- **Deciders:** Nico + agente

## Context

El catálogo vendrá de una API propia en Docker que **todavía no existe** y que se desarrollará
después del storefront. La Fase 1 necesita datos igualmente. La tentación evidente —importar un
array de fixtures desde los componentes y «ya lo cambiaremos»— convierte la migración posterior en
una búsqueda de importaciones por todo el árbol, y deja el contrato de la API sin definir hasta el
día en que alguien empiece a escribir endpoints.

## Decision

- El contrato se define **antes** que el backend, con **Zod**, en `src/lib/api/contract.ts`. Ese
  archivo es la fuente de verdad: los tipos de TypeScript se infieren de los esquemas, no al revés.
- Los componentes hablan con una interfaz `CatalogRepository` (cinco operaciones: `listProducts`,
  `getProduct`, `getRelated`, `getFacets`, `search`). Nunca con `fetch` ni con fixtures.
- Dos implementaciones: `mock-repository` (sobre `src/fixtures/catalog.ts`) y `http-repository`
  (contra `API_BASE_URL`). Se elige con la variable de entorno `API_MODE=mock|http`.
- Las respuestas HTTP se validan con Zod en runtime. Un backend que se desvíe del contrato falla
  de forma ruidosa y localizada, no con un `undefined` tres componentes más abajo.
- Los **contract tests corren contra ambos adaptadores**. El día que exista el backend, ya hay una
  suite que verifica que cumple lo pactado.

## Alternatives considered

- **Fixtures importados directamente en los componentes.** Cero infraestructura hoy, refactor
  disperso mañana, y el contrato queda sin escribir.
- **MSW interceptando red en desarrollo.** Simula el backend de forma realista, pero en App Router
  buena parte de la carga ocurre en server components, donde el worker de navegador no aplica; y
  añade una dependencia que sólo sirve mientras el backend no existe.
- **Route handlers de Next (`/app/api/*`) como backend provisional.** Tendríamos que reescribir esa
  capa cuando llegue el backend real, o dejarla como proxy permanente. Pura deuda.
- **tRPC.** Acopla frontend y backend al mismo monorepo y lenguaje, justo lo contrario de lo que se
  busca: un backend independiente en su propio contenedor.
- **Generar el cliente desde un OpenAPI.** Es la opción correcta *cuando el backend exista*. Hoy no
  hay OpenAPI del que generar. Los esquemas Zod pueden exportarse a OpenAPI más adelante si se
  quiere invertir la dirección.

## Consequences

- Migrar al backend real es cambiar `API_MODE=http` y apuntar `API_BASE_URL`. Ni un componente se
  toca.
- El contrato de la API es un entregable revisable **antes** de escribir el primer endpoint, lo que
  convierte una discusión de integración tardía en una decisión temprana y barata.
- Coste: una capa de indirección y ~5 funciones duplicadas entre adaptadores mientras dure la Fase 1.
- La validación Zod en runtime tiene un coste por request, despreciable al volumen esperado.
- El futuro `api/` deberá tratar `contract.ts` como especificación. Conviene que su suite de tests
  la importe en lugar de redefinir los tipos.
