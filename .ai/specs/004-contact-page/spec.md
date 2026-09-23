# 004 · Página de contacto (sólo visual)

- **Estado:** implementado (2026-09-23)
- **Fecha:** 2026-09-23
- **Padre:** [001-storefront-fase-1](../001-storefront-fase-1/spec.md)
  (`/contacto` era Fase 2; la ruta ya está en `routing.ts` y 404a).
- **Fuente de diseño (única):** prototipo
  [`QUUhcHp24QBtXkUG8sHPDj`](https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj)
  (HTML embebido leído el 2026-09-23). El PDF sigue gobernando tokens, táctil
  y contraste (RNF-1/2 de 001). Copy y layout salen del JS del prototipo, no
  del OCR ni de sparksinsumos.com.

## Problema

El chrome ya enlaza a `/es/contacto` · `/en/contact` (header, menú, footer).
El catch-all responde 404. Falta la página del prototipo.

## Objetivo

Publicar la página de contacto **fiel al prototipo**. El formulario se ve y
se puede tipear; **no envía nada**. WhatsApp del panel derecho sí es un
`wa.me` real (ya existe). La integración con `api/` es otra spec.

## Alcance

### Dentro

1. Ruta `/contacto` · `/contact` con un `h1`, SEO vía `seoMetadata()`.
2. Columna izquierda: kicker, título, bajada, 4 campos + textarea + CTA.
3. Columna derecha: WhatsApp / Email / Showroom + panel ink de WhatsApp.
4. Diccionario es / en con la copy del prototipo.
5. A11y, táctil y 360px de 001.

### Fuera

- POST / email / ticket / toast «Mensaje enviado».
- Validación de campos (estados error del §03 se reservan).
- Query `?order_cancellation_without_id=true` (arrepentimiento de la
  Tiendanube viva; constitution §12). Otra spec.
- Login, registro, cuenta, sets, checkout.
- Cambiar el número de WhatsApp o inventar destinos legales.

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como visitante abro Contacto y veo el layout del prototipo |
| US-2 | P0 | Como visitante tengo un camino inmediato a WhatsApp |
| US-3 | P1 | Lo mismo en inglés y a 360px, un solo h1, sin overflow |

## Requisitos

### RF-1 · Shell

`main` en grilla `colsSplit`: una columna &lt;900px; dos `1fr 1fr` desde 900.
`border-b` hairline. Izquierda: padding
`clamp(42→66) / gutter / clamp(52→80)`, flex col gap 24.

### RF-2 · Copy (prototipo)

| Clave | es | en |
|-------|----|----|
| kicker | Contacto | Contact |
| title | Escribinos. | Write to us. |
| body | Respondemos consultas de stock, mayorista y envíos. Si es urgente, WhatsApp es el canal más rápido. | We answer stock, wholesale and shipping questions. If it is urgent, WhatsApp is the fastest channel. |
| name | Nombre | First name |
| phone | Teléfono / WhatsApp | Phone / WhatsApp |
| email | Email | Email |
| subject | Asunto | Subject |
| message | Mensaje | Message |
| messagePh | ¿En qué te podemos ayudar? | How can we help? |
| send | Enviar mensaje | Send message |
| waPanelTitle | Consultas en el día | Same-day answers |
| waPanelBody | Stock, seguimiento de envíos, precios por cantidad y coordinación de pagos. | Stock, shipment tracking, volume pricing and payment coordination. |

Placeholders de los 4 inputs: `Camila` · `+54 9 11 .` · `camila@mail.com` ·
`Consulta de stock` / `Stock question`.

### RF-3 · Formulario (muerto)

Cuatro `TextInput` en `formCols`: 1 col &lt;700px; 2 cols desde 700.
`BoxedTextArea` a todo el ancho, 4 filas (ya existe para este uso).
Botón primario «Enviar mensaje». `onSubmit` hace `preventDefault`. Sin
toast, sin `fetch`, sin contrato nuevo.

### RF-4 · Aside

Tres filas, `border-b` hairline, padding `clamp(22→30) / clamp(20→48)`:

| k | v | note es | note en |
|---|---|---------|---------|
| WhatsApp | +54 9 11 6869 2694 | Lunes a sábado, 10 a 19 h. | Mon to Sat, 10am to 7pm. |
| Email | hola@sparksparfums.com | Respuesta en 24 h hábiles. | Reply within 24 business hours. |
| Showroom | Franklin, CABA | Retiro con turno previo. | Pickup by appointment. |

k: mono 9.5px meta. v: display **24px** (el proto ya lo pone a 24; oro no
aplica). note: 12.5px / 300 / `#4A423B`.

Debajo, bloque ink a `flex: 1` (href `wa.me` mensaje general):

- Kicker: `WhatsApp · 11 6869 2694`. El proto lo pinta success a 10px sobre
  ink. Si axe `color-contrast` falla, el color pasa a canvas y el punto
  success de 8px queda no-texto (mismo patrón del FAB).
- Título 32px display: `waPanelTitle`.
- Cuerpo 13px / 300 / canvas 0.75.

### RF-5 · Contraste

Kicker de página: el proto usa gold 10px. **Acá ≥24px** (`text-accent-gold`
+ `text-[24px]` o raya no-texto + label canvas). RNF-2.

## Criterios de aceptación

| ID | Criterio |
|----|----------|
| AC-1 | `/es/contacto` y `/en/contact` 200. Un `h1` («Escribinos.» / «Write to us.») |
| AC-2 | 4 inputs + textarea + botón visibles; el submit no navega ni llama red |
| AC-3 | Aside muestra los tres valores de RF-4. Email del prototipo |
| AC-4 | El panel ink es un enlace `wa.me/5491168692694` |
| AC-5 | Header «Contacto» deja de 404ar |
| AC-6 | Axe / touch / copy-elasticity / un h1 verdes en esta ruta |
| AC-7 | Cero literales en componentes. Paridad es/en |

## Preguntas abiertas

Ninguna bloquea el visual. El email del proto (`hola@sparksparfums.com`) no
es el de la tienda viva (`sparksinsumos@gmail.com`). Esta spec usa el proto.
Cambiarlo es una decisión de negocio, no de diseño.
