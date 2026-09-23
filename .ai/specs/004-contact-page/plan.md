# Plan técnico · 004 Contacto (visual)

- **Estado:** implementado (2026-09-23)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** ninguno. Reusa 0002 (ruta ya traducida), 0003 (sin repositorio:
  no hay API de contacto todavía) y los primitives de formulario de 001.

## 1 · Enfoque

Una página nueva que **reclama** `/contacto` (hoy cae en `[...rest]` → 404).
El markup se copia del prototipo (`isContact` en el HTML embebido). El
formulario es una isla cliente mínima: `preventDefault` y nada más.

No se toca `api/`, el contrato ni el carrito. WhatsApp reusa
`buildWhatsappUrl` + `whatsapp.general`.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `web/src/app/[locale]/contacto/page.tsx` | RSC: metadata + montaje |
| `web/src/components/contact/contact-page.tsx` | Layout 2 col + aside |
| `web/src/components/contact/contact-form.tsx` | Isla: 4 inputs + textarea + CTA |
| `web/src/i18n/messages/{es,en}.json` | `contact.*` |
| `web/src/i18n/__tests__/messages.test.ts` | Allowlist si hace falta |
| `web/src/components/contact/__tests__/contact-page.test.tsx` | AC-1–AC-4, axe |
| `web/e2e/contact.spec.ts` | 200, h1, wa.me, submit no navega |
| `web/e2e/helpers.ts` | Sumar `/es/contacto` · `/en/contact` a `PHASE1_ROUTES` |

`routing.ts` ya tiene `/contacto` → `/contact`. No se toca.

Primitives: `TextInput` (línea) y `BoxedTextArea` (el §03 ya la reserva
para contacto). `ButtonPrimary` o las mismas clases `BUTTON_TYPE` +
`TOUCH_TARGET` del hero.

## 3 · Layout (del HTML del prototipo)

```
main  grid  colsSplit (1 col <900; 1fr 1fr ≥900)  border-b hairline
  left   pad clamp(42→66) gutter clamp(52→80)  flex col gap-24
    kicker  mono gold ≥24px uppercase tracking 0.22em
    h1     font-display  clamp(34→56)  (= text-h1-page o clamp propio)
    body   14.5px / 300 / #4A423B  max-w 48ch
    form   grid formCols (1 col <700; 2 cols ≥700) gap-16
      TextInput × 4
      BoxedTextArea  col-span-full  rows=4
      button primario  px-34 py-17
  right  border-l hairline  flex col
    ×3  border-b  pad clamp(22→30)/clamp(20→48)
         k mono 9.5  ·  v display 24px  ·  note 12.5 / 300
    a    flex-1  bg-ink  text-canvas  pad clamp(30→40)/clamp(20→48)
         kicker WhatsApp · 11 6869 2694
         32px display  waPanelTitle
         13px / 0.75  waPanelBody
```

`h1` del proto es `clamp(34px, 4.4vw, 56px)` — casi `text-h1-page`
(32→52). Usar **el clamp del proto** en la página (no inventar un token)
o `text-h1-page` si el test de escala lo prefiere. El plan elige el
clamp del proto en la clase de la página: es fidelidad, no un token
nuevo.

## 4 · i18n

Namespace `contact` (RF-2). Placeholders también en el diccionario
(`namePh`, `phonePh`, `emailPh`, `subjectPh`). El número del panel
kicker se compone: `WhatsApp · {short}` con `11 6869 2694` (el proto no
lo traduce).

`whatsapp.general` ya existe para el href.

## 5 · Datos / API

Ninguno. `sendContact` del proto sólo hace `flash('Mensaje enviado')`.
Acá no se reproduce: mentiría. La siguiente spec añadirá el contrato
(`POST /contact`) y el toast.

El valor de Email es copy. `mailto:` es opcional y no es backend.

## 6 · Trade-offs

| Opción | Se elige | Por qué |
|--------|----------|---------|
| Página RSC + isla sólo en el form | Sí | Convención: cliente donde el browser actúa |
| Form `action` GET / `#` | No | Recargaría la página |
| Toast al click | No | No hubo envío (RF-3) |
| Email de la Tiendanube | No | El usuario fijó el proto como única fuente visual |
| Oro 10px en el kicker | No | RNF-2 / constitution; ≥24px |
| Success 10px en el panel | Probar | Sobre ink puede pasar axe; si no, canvas + `WhatsappDot` |
| Sumar la ruta a `PHASE1_ROUTES` | Sí | AC-6 es el mismo gate que el resto del storefront |
| ADR | No | No hay decisión no obvia |

## 7 · Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Visitante cree que «Enviar» mandó el mail | Medio | Sin toast; spec lo deja explícito |
| `hola@sparksparfums.com` ≠ gmail vivo | Bajo | Anotado; se cambia si el negocio lo pide |
| Kicker gold 24px envuelve a 360 | Bajo | Raya no-texto + label canvas (mismo fallback que 002) |
| Success 10px en ink falla axe | Medio | Fallback RF-4 |
| `PHASE1_ROUTES` alarga E2E | Cosmético | Una ruta más, 4 viewports; axe sólo en 360 |

## 8 · Test

| AC | Dónde |
|----|--------|
| AC-1 | `contact-page.test.tsx` + `e2e/contact.spec.ts` |
| AC-2 | Testing Library: 4 textbox + textarea + button; submit no llama `fetch` (spy) |
| AC-3 | `getByText('hola@sparksparfums.com')`, Franklin, número |
| AC-4 | panel `getByRole('link')` href `wa.me/5491168692694` |
| AC-5 | E2E: click «Contacto» en el header → URL `/es/contacto`, no 404 |
| AC-6 | `PHASE1_ROUTES` + axe del componente |
| AC-7 | lint + paridad de claves |

Gate: `docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run verify`
y `… run --rm e2e`. Reiniciar `web` si Turbopack no levanta la ruta nueva.

## 9 · Fuera de este plan

`api/` de contacto, validación, toast, arrepentimiento por query, y el
resto de Fase 2 (login, registro, cuenta, sets).
