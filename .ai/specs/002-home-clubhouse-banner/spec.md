# 002 · Pie de home: Club, franja comercial y footer

- **Estado:** implementado (2026-09-23)
- **Fecha:** 2026-09-23
- **Padre:** [001-storefront-fase-1](../001-storefront-fase-1/spec.md) (T044 footer, T045 FAB, T054 club)
- **Fuente de diseño:** prototipo
  [`QUUhcHp24QBtXkUG8sHPDj`](https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj)
  (copy y medidas leídas del HTML embebido el 2026-09-23). Los captures del
  usuario marcan el hueco; el prototipo manda el detalle. El PDF sigue
  gobernando tokens, táctil y contraste (RNF-1/2 de 001).

## Problema

No falta el bloque club: **está mal**. Entre ese banner y el footer el
prototipo tiene una **franja de tres promesas** que no existe. El footer y el
FAB no calzan el diseño: títulos sin oro, links en label mayúscula más pesados
que los 13.5px del prototipo, sin franja de copyright, y el WhatsApp fijo se
pierde sobre el ink porque no tiene borde.

## Objetivo

Las tres bandas del cierre de home (Club → franja comercial → footer) y el FAB
quedan fieles al prototipo, sin implementar auth, cupón ni legales clickeables.

## Alcance

### Dentro

1. **Rehacer `Club`** al layout y copy del prototipo (no es un banner extra).
2. **Añadir** la franja canvas de tres celdas **después** del club y **antes**
   del footer. Los tiles T054 (envíos / asesoramiento / cambios) que viven
   *arriba* del club no se tocan.
3. **Corregir el footer** a la grilla, tipo, oro, redes, columnas y barra de
   copyright del prototipo.
4. **Borde canvas/20 en el FAB** para que se lea sobre el footer.

### Fuera

- Páginas `/registro`, `/ingresar`, `/cuenta`, `/contacto`, `/sets` (siguen 404
  salvo las que ya existen: carrito y catálogo).
- Aplicar el 5%, VIP15 o preventas (T083 / backend).
- Destinos legales de «Defensa de consumidores» y «Botón de arrepentimiento»
  (en el prototipo son texto, no enlaces). No se inventan URLs.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como visitante veo la oferta de Sparks Club y un camino a crear cuenta / ingresar |
| US-2 | P0 | Como visitante, entre el club y el footer, leo envíos, pagos y precio por cantidad |
| US-3 | P0 | Como visitante reconozco el footer del prototipo: oro en columnas, redes, copyright separado, WhatsApp visible |
| US-4 | P1 | Lo mismo en inglés y a 360px, sin desbordes ni controles <44px |

## Requisitos funcionales

### RF-1 · Club (reescribir `club.tsx`)

Fondo ink. Dos columnas desde `lg`. Derecha con `border-l` canvas/18 y cuatro
filas iguales (`border-b` canvas/14).

Copy del prototipo:

| Clave | es | en |
|-------|----|----|
| kicker | Sparks Club | Sparks Club |
| title | Registrate y comprá distinto. | Sign up and shop differently. |
| body | Los clientes con cuenta acceden a precio de socio, preventas y a un cupón permanente de bienvenida. | Account holders get member pricing, early access to drops and a permanent welcome coupon. |
| ctaCreate | Crear cuenta | Create account |
| ctaSignIn | Ya tengo cuenta | I have an account |
| 01 | Precio de socio / 5% off permanente en todo el catálogo. | Member price / Permanent 5% off the whole catalogue. |
| 02 | Preventas / Acceso 48 h antes a cada ingreso. | Early access / 48 h head start on every restock. |
| 03 | Cupón VIP15 / Cupón de bienvenida acumulable. | VIP15 coupon / Stackable welcome coupon. |
| 04 | Seguimiento / Historial de pedidos y envíos en un lugar. | Tracking / Orders and shipments in one place. |

- «Crear cuenta» → `/registro` (`/en/register`). Primario invertido: canvas sobre ink.
- «Ya tengo cuenta» → `/ingresar`. Fantasma: borde `canvas/35`.
- Título `<h2>`. El 5% / VIP15 / 48 h son copy, no reglas.

### RF-2 · Franja comercial (nuevo, entre club y footer)

Grilla `auto-fit minmax(min(100%, 250px), 1fr)`, gap 1px, fondo hairline (el
mismo truco que familias). Cada celda canvas.

| Kicker | Título | Cuerpo (es) |
|--------|--------|-------------|
| Envíos | Todo el país | Correo Argentino y cargo, a cotizar según tamaño y peso. |
| Pagos | Tarjeta, transferencia o efectivo | Hasta 3 cuotas sin interés. Retiro en Franklin, CABA. |
| Mayorista | Precio por cantidad | Desde $100.000 se aplican descuentos automáticos. |

Inglés del prototipo: Shipping / Nationwide; Payments / Card, transfer or cash;
Wholesale / Volume pricing. Showroom: **Franklin**, no Palermo (el capture OCR
engañaba; el JS del prototipo dice Franklin).

### RF-3 · Footer

Grilla `1.4fr 1fr 1fr 1fr` (≥1140). Wordmark «Sparks» display 28px tracking
0.26em, **sin** bajada PARFUMS. Blurb 13px / 300 / 0.7:

> Perfumería de alta concentración y cosmética seleccionada. Retiro en
> Franklin, envíos a todo el país.

Redes del prototipo (ya no se inventan):

- Instagram → `https://instagram.com/sparks.insumos`
- TikTok → `https://www.tiktok.com/@sparks.insumos`
- Facebook → `https://www.facebook.com/sparks.insumos`

Columnas (título oro, links 13.5px / 300 / 0.78, **sin** uppercase de label):

| Tienda | Cuenta | Ayuda |
|--------|--------|-------|
| Catálogo → `/catalogo` | Ingresar → `/ingresar` | Contacto → `/contacto` |
| Ámbar & especias → `/catalogo?family=ambar-especias` | Crear cuenta → `/registro` | Envíos y retiro → `/contacto` |
| Gourmand → `/catalogo?family=gourmand` | Tu carrito → `/carrito` | Cambios y devoluciones → `/contacto` |
| Sets → `/sets` | Tus pedidos → `/cuenta` | |

Barra inferior: `border-t` canvas/16, flex space-between, mono 9.5px / 0.55:

- `© {year} Sparks Parfums · Buenos Aires, Argentina`
- `Defensa de consumidores · Botón de arrepentimiento` (span, sin href)

Se elimina la columna «Escribinos» / WhatsApp del footer actual: el prototipo
no la tiene; el canal es el FAB.

### RF-4 · FAB

`border border-canvas/20` (el prototipo: `1px solid rgba(245,241,234,0.2)`).
Hover success sin cambio. Sigue oculto con overlay.

### RF-5 · Semántica y a11y heredadas

Un `<h1>` en la home. Club y franja usan `<h2>` / lista. AC-13/15/17 de 001
siguen verdes.

## Requisitos no funcionales

Hereda RNF-1–8 de 001.

**Oro <24px.** El prototipo pinta kickers e índices en gold a 9.5–10px. Eso
rompe RNF-2 y axe (`#8A6B32` sobre ink ~3.6:1; sobre canvas 4.4:1). La spec
exige **el color oro**, no el cuerpo de 10px: índices, kickers de franja y
títulos de columna van en `text-accent-gold` a **≥24px** (el test
`accent-gold.test.ts` y axe lo exigen). Si algún título de columna a 24px
rompe la grilla a 360px, el oro pasa a un marcador no-texto de 6px y el label
queda canvas.

## Criterios de aceptación

| ID | Criterio |
|----|----------|
| AC-1 | Orden en home: … `Club` → franja comercial → `Footer`. Un solo club ink |
| AC-2 | Club: h2 «Registrate y comprá distinto.», 4 beneficios `01`–`04`, CTAs a `/registro` e `/ingresar`. Sin WhatsApp en el banner |
| AC-3 | Franja: tres celdas Envíos / Pagos / Mayorista con la copy de RF-2 |
| AC-4 | Footer: tres columnas Tienda / Cuenta / Ayuda con título `text-accent-gold`; redes con los href de RF-3; barra de copyright con borde superior |
| AC-5 | El footer no tiene columna «Escribinos» ni link WhatsApp |
| AC-6 | El FAB tiene borde canvas y se distingue sobre el footer |
| AC-7 | Cero literales en componentes (lint). Paridad es/en |
| AC-8 | Axe de Club, franja y Footer: cero critical/serious |
| AC-9 | Touch + copy-elasticity de 001 en `/es` y `/en` siguen verdes |

## Preguntas abiertas

Ninguna bloquea. El 404 de cuenta/registro es el mismo patrón que el header.
El oro a ≥24px es la única desviación consciente del prototipo (RNF-2).
