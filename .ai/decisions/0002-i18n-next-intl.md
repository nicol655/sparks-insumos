# ADR 0002: i18n con next-intl, prefijo de ruta y carrito persistido

- **Status:** accepted
- **Date:** 2026-09-22
- **Deciders:** Nico + agente

## Context

El §06 del PDF impone dos condiciones que tiran en direcciones opuestas:

1. Dos locales, `es-AR` (por defecto) y `en`, conmutables en runtime desde el header.
2. «Los cambios de idioma no recargan la página ni pierden el carrito.»

Además es un e-commerce: cada idioma necesita una URL propia e indexable, lo que empuja hacia el
prefijo de ruta (`/es`, `/en`). Pero con App Router, cambiar el segmento `[locale]` desmonta el
layout de ese segmento y con él cualquier estado que viva sólo en memoria — es decir, el carrito.

## Decision

- **`next-intl`** como librería de i18n, con el plugin de Next y middleware de negociación.
- **Prefijo de ruta**: `/es/...` y `/en/...`, con `es` como locale por defecto.
- **El carrito se persiste en `localStorage`** mediante el middleware `persist` de Zustand, de modo
  que sobrevive al remontaje del layout, a la recarga y a la navegación entre rutas.
- **El cambio de idioma usa `router.replace` del router de `next-intl`**, que es navegación
  cliente: no hay recarga completa de página.
- **Ninguna cadena literal en el markup.** Los diccionarios viven en `src/i18n/messages/{es,en}.json`
  y `eslint-plugin-i18next` (`no-literal-string`) hace fallar el build si alguien embebe texto.
- Ambas condiciones del PDF se verifican en E2E (AC-6 y AC-7), no por inspección manual.

## Alternatives considered

- **Locale por cookie, sin prefijo de ruta.** Evita el remontaje del layout, que era justo el
  problema. Se descarta porque deja ambos idiomas en la misma URL: Google indexa una sola versión y
  el inglés queda invisible. Inaceptable para un e-commerce.
- **Diccionarios en un React Context, sin librería.** Menos dependencias, pero habría que resolver
  a mano el formato de plurales, la negociación de locale, el pasaje de mensajes a server
  components y las URLs localizadas. `next-intl` hace exactamente eso y nada más.
- **`next-i18next` / `react-i18next`.** Orientados a Pages Router; su soporte de server components
  es más incómodo.
- **Subir el carrito por encima de `[locale]` en el árbol de layouts.** Técnicamente evitaría el
  remontaje, pero deja el estado del carrito fuera del alcance del locale y complica la estructura
  de rutas. La persistencia resuelve lo mismo con menos acoplamiento y, de paso, cubre la recarga.

## Consequences

- El carrito sobrevive a cualquier navegación, no sólo al cambio de idioma. Efecto secundario
  deseable.
- Al persistir en `localStorage` hay que tratar el carrito guardado como entrada no confiable: se
  valida con Zod al hidratar y **los precios se recalculan siempre desde el repositorio**, nunca se
  leen del almacenamiento (un carrito viejo no puede congelar un precio desactualizado).
- La hidratación de un store persistido puede producir desajuste servidor/cliente; el contador del
  header se renderiza tras la hidratación para evitarlo.
- El PDF advierte que el inglés corre 15–30% más largo, así que el layout debe probarse en ambos
  idiomas a 360px (AC-17).
