# ADR 0001: Next.js App Router + Tailwind v4 con tokens CSS-first

- **Status:** accepted
- **Date:** 2026-09-22
- **Deciders:** Nico + agente

## Context

El usuario fija React + Next.js + TypeScript + Tailwind como requisito. Lo que queda por decidir es
*cómo*. El diseño (`Tienda perfumes diseño web.pdf`) es un sistema de tokens con valores exactos:
9 colores, 12 niveles tipográficos con `clamp`, una escala de espaciado de 4px y seis breakpoints
propios. El riesgo real del proyecto no es elegir framework, es que esos valores se dispersen en
clases arbitrarias (`text-[#14100E]`, `md:text-[46px]`) y el sistema se degrade con el tiempo.

## Decision

- **Next.js 16 con App Router** y React 19. Server components por defecto; `'use client'` sólo en
  carrito, drawer, overlay de búsqueda y filtros.
  El plan original decía Next 15; al implementar, la estable era 16.3.5 y todo el stack la soporta
  (`next-intl` declara `^16.0.0` como peer). Arrancar en un major anterior no tenía justificación.
- **TypeScript estricto** con `noUncheckedIndexedAccess`, `noImplicitOverride` y
  `noFallthroughCasesInSwitch`.
- **Tailwind CSS v4 con configuración CSS-first.** Todos los tokens del PDF viven en un bloque
  `@theme` en `src/styles/theme.css`, que es simultáneamente la definición de las utilidades de
  Tailwind y el export de variables CSS que pide el §05 del documento.
- **Se reemplazan los breakpoints por defecto** de Tailwind por los seis del PDF, en lugar de
  añadirlos.
- **Se anula la escala de radios** (`--radius-*: initial`) y se deja una única excepción
  (`--radius-chip: 999px`), porque el sistema es rectangular por decisión de diseño.
- **Sin librería de componentes.** Las primitivas del §03 se escriben a mano.

## Alternatives considered

- **Tailwind v3 con `tailwind.config.js`.** Ecosistema más maduro, pero obliga a mantener los
  tokens en JS y a re-exportarlos como variables CSS: dos fuentes de verdad para los mismos hex.
- **shadcn/ui o Radix Themes.** Aportan accesibilidad ya resuelta, pero traen una estética de
  radios, sombras y escalas opuesta a este diseño. Desarmarla cuesta más que escribir 12 primitivas
  rectangulares. Radix Primitives (sin estilos) queda como opción abierta si el foco atrapado del
  drawer o el acordeón resultan más frágiles de lo previsto.
- **CSS Modules o vanilla-extract.** Descartados: el usuario pidió Tailwind explícitamente.
- **Pages Router.** Descartado: `next-intl` y el layout anidado por locale son notablemente más
  simples en App Router.
- **Quedarse en Next 15** para respetar el plan al pie de la letra. Descartado: empezar un proyecto
  nuevo en un major anterior es deuda desde el día uno, y no había incompatibilidad que lo exigiera.

## Consequences

- Cambiar un color del diseño es editar una línea de `theme.css`; los tests de tokens
  (AC-1 a AC-3) garantizan que nadie lo esquive con un valor arbitrario.
- `rounded-lg` deja de existir, así que no se puede introducir un radio por costumbre.
- Al no usar un UI kit, la accesibilidad de drawer, overlay y acordeón es responsabilidad nuestra y
  debe estar cubierta por tests (AC-11 a AC-13).
- Dependemos de Tailwind v4, aún joven. Al no usar plugins de terceros, la exposición es baja.
