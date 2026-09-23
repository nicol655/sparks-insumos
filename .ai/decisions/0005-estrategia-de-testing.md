# ADR 0005: Estrategia de testing — Vitest + Testing Library + Playwright + axe

- **Status:** accepted
- **Date:** 2026-09-22
- **Deciders:** Nico + agente

## Context

El usuario pide que «el código esté testeado de manera que al implementar futuras features se pueda
validar que no rompe compatibilidad». El valor buscado no es cobertura, es **protección contra
regresiones** al añadir las rutas de la Fase 2.

Dos rasgos de este proyecto condicionan la elección. Primero, buena parte de lo que puede romperse
es *visual y de sistema de diseño*: un hex cambiado, un `clamp` mal copiado, un radio que aparece
donde no debe. Segundo, el §06 del PDF define criterios transversales duros —contraste, foco
visible, áreas táctiles de 44px, `prefers-reduced-motion`, elasticidad de copy entre idiomas— que
son requisitos de aceptación, no recomendaciones.

## Decision

Cinco niveles, cada uno con criterios de aceptación asignados en `plan.md` §8:

1. **Tokens** — Vitest parsea `src/styles/theme.css` y compara contra las tablas del PDF. Un hex
   cambiado a mano rompe la suite (AC-1, AC-2, AC-3).
2. **Unidad** — Vitest para lógica pura: `formatPrice`, `buildWhatsappUrl`, reducers del carrito,
   filtrado y orden.
3. **Componente** — Vitest + Testing Library, sobre las primitivas del §03 y sus estados
   (default, hover, active, focus, disabled). Los componentes reciben props; no hay red.
4. **Contrato** — la misma suite corre contra `mock-repository` y `http-repository`, de modo que
   el backend futuro tenga una definición ejecutable de lo que debe cumplir.
5. **E2E y accesibilidad** — Playwright con `@axe-core/playwright` por ruta y locale, más
   proyectos a 360 / 900 / 1140 / 1440px. Aquí viven los criterios que sólo existen en un navegador
   real: persistencia del carrito al cambiar de idioma, foco atrapado en el drawer, marquesina
   detenida con reduced motion, ausencia de scroll horizontal a 360px en ambos idiomas.

A nivel componente la accesibilidad se chequea con **`axe-core` invocado directamente** desde el
helper `src/test/a11y.ts`, no a través de un matcher de terceros. El wrapper habitual,
`vitest-axe`, está sin publicar desde 2022 y sus tipos aumentan el namespace global `Vi`, que
Vitest 5 ya no lee; mantenerlo obligaba a versionar un shim de tipos para un paquete muerto y
arrastraba seis dependencias transitivas. El helper son ~15 líneas, no necesita augmentación de
tipos y nos deja controlar el mensaje de error. Desactiva `color-contrast`, que en jsdom no tiene
layout real y se verifica en el E2E.

**No se fija un umbral de cobertura.** Se reporta cobertura, pero la regla es que cada criterio de
aceptación tenga un test nombrado. Un porcentaje se cumple escribiendo tests vacíos; un AC, no.

## Alternatives considered

- **Sólo Vitest + Testing Library.** Cubre lógica y componentes, pero deja fuera exactamente los
  requisitos más caros de este diseño: reduced motion, layout responsive real, contraste calculado,
  persistencia entre navegaciones. jsdom no renderiza, así que no puede verificarlos.
- **Regresión visual por screenshots.** Es la defensa más directa para un proyecto tan guiado por
  diseño, y fue evaluada. Se descarta **por ahora** por las capturas de referencia inestables entre
  el contenedor y la máquina local (renderizado de fuentes) y por el coste de mantenimiento en una
  UI que todavía cambia a diario. Los tests de tokens cubren buena parte del mismo riesgo a un
  coste mucho menor. Reconsiderar cuando la Fase 1 esté estable.
- **Cypress en vez de Playwright.** Playwright trae imagen Docker oficial con navegadores
  preinstalados, emulación de `prefers-reduced-motion` y proyectos multi-viewport de serie.
- **Umbral de cobertura al 80%.** Fácil de satisfacer sin aportar protección real.

## Consequences

- Una feature futura que rompa un token, un estado de componente o un criterio de accesibilidad
  falla en CI antes de llegar a revisión: exactamente lo que el usuario pidió.
- La suite E2E tarda más que la unitaria; se ejecuta en un servicio Docker aparte y no bloquea el
  ciclo rápido de desarrollo.
- El coste de escribir tests de tokens y de estados por componente es real y debe estar
  presupuestado en `/tasks`, no improvisado al final.
- Los E2E corren con `API_MODE=mock`, lo que los hace deterministas pero **no** valida la
  integración con el backend. Esa brecha la cubren los contract tests cuando `api/` exista.
