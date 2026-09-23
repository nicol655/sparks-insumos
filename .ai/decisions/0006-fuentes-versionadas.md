# ADR 0006: Fuentes versionadas en el repositorio, no descargadas en cada build

- **Status:** accepted
- **Date:** 2026-09-22
- **Deciders:** Nico + agente

## Context

El sistema de diseño usaba `next/font/google`, que descarga Cormorant Garamond, Jost e IBM Plex
Mono desde `fonts.googleapis.com` **en cada `next build`**. Un build del gate falló con veinte
errores `Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'` y
`next/font/google queries have exactly one entry`; el siguiente, sin cambiar una línea, pasó. El
CSS que devuelve Google varía y Turbopack se atraganta.

Un gate de calidad que falla al azar deja de ser un gate: entrena al equipo a reintentar en lugar
de investigar, y esconde fallos reales. Además contradice el espíritu del ADR-0004 —un clon limpio
debe poder verificarse— si «limpio» exige además conectividad a un tercero.

## Decision

Los `.woff2` viven en el repositorio, en `web/src/styles/fonts/`, y `web/src/styles/fonts.ts` usa
**`next/font/local`**. Un build no toca la red.

Los archivos los produce `web/scripts/fetch_fonts.py`, que se ejecuta **a demanda**, nunca durante
un build:

```powershell
docker compose -f docker/docker-compose.yml run --rm fonts
```

El script pide el CSS a la API de Google Fonts con un *user agent* antiguo —que devuelve la TTF
completa en lugar de los woff2 ya troceados por subset— y recorta con `pyftsubset` un único
archivo por cara. Corre en la etapa `fonts` del `Dockerfile` de `web/` (Python + fonttools), detrás
del perfil `tools` para que nunca se construya sola.

### Sólo el subset latino

§02 pide `latin` + `latin-ext`. Se envía **sólo `latin`**, medido:

| Subsets | Peso total (10 caras) |
|---------|----------------------|
| latin + latin-ext | 204KB — **por encima** del presupuesto |
| latin | **136KB** — dentro |

El presupuesto de RNF-7 es 180KB. Ni el español rioplatense ni el inglés usan un solo *codepoint*
de `latin-ext`: las vocales acentuadas, la `ñ`, los signos de apertura, la raya y los símbolos de
moneda están todos en `latin` (U+0000-00FF más el bloque de puntuación U+2000-206F). `latin-ext`
cubre Europa del Este y turco, que no aparecen en el contenido ni en los nombres de las marcas.

Volver a incluirlo es añadir `LATIN_EXT` a `UNICODES` en el script y volver a correrlo, pero
entonces hay que renegociar el presupuesto.

## Alternatives considered

- **Reintentar y seguir con `next/font/google`.** Cero trabajo, pero el gate sigue siendo
  aleatorio y la causa real no desaparece.
- **Cachear la descarga entre builds.** Un volumen de Docker para el caché de `next/font` ayudaría
  en local y no en CI ni en un clon nuevo, que es justo donde duele.
- **Servir los dos subsets como archivos separados, como hace Google.** Es lo correcto en teoría,
  pero `next/font/local` no admite `unicode-range` por archivo de origen (`src` sólo acepta `path`,
  `weight` y `style`), así que dos archivos de la misma familia y peso colisionan. La alternativa
  era escribir los `@font-face` a mano y perder el *preload* automático y las métricas de
  *fallback* ajustadas que evitan CLS.
- **`@font-face` a mano en CSS apuntando a `public/fonts/`.** Control total, pero se pierde
  `adjustFontFallback` y el *fingerprinting*, y hay que mantener las reglas a mano.

## Consequences

- El build es determinista y offline. Comprobado: `docker run --network none … npm run build`
  termina en verde.
- Entran ~136KB de binarios al repositorio. Se tocan sólo cuando cambia el conjunto de caras.
- `npm run font-budget` ya no necesita construir nada: mide los archivos versionados. Antes tenía
  que compilar y clasificar la salida de Turbopack leyendo `unicode-range` del CSS minificado, con
  las trampas que documenta `lessons.md`.
- Actualizar una tipografía deja de ser automático: hay que correr la etapa `fonts` a conciencia.
  Es el precio de no depender de un tercero en cada build, y en un sistema de diseño cerrado las
  tipografías no cambian solas.
- Aparece Python en el repositorio, sólo como herramienta y aislado en una etapa con perfil. No
  entra en ninguna imagen de desarrollo ni de producción.
