# Plan técnico · 002 Pie de home (Club + franja + footer)

- **Estado:** implementado (2026-09-23)
- **Fecha:** 2026-09-23
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** ninguno nuevo. Reusa 0002 (rutas reservadas), 0003 (sin repositorio)
  y T044 de 001 (chrome que 404a). Las URLs de redes **sí** están en el
  prototipo; T044 las omitió porque entonces no había fuente.

## 1 · Enfoque

Tres diffs independientes, en este orden (cada uno testeable solo):

1. Reescribir `club.tsx` — el componente ya está montado; el markup está mal.
2. Nuevo `commerce-strip.tsx` montado en `page.tsx` **entre** `<Club />` y el
   footer del layout.
3. Reescribir `footer.tsx` + borde en `whatsapp-fab.tsx`.

No se toca `Services` de T054 (vive arriba del club). No hay API ni store.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `web/src/components/home/club.tsx` | Layout 2 col, h2, 2 `Link`, `ol` de beneficios |
| `web/src/components/home/commerce-strip.tsx` | Nuevo. 3 celdas RF-2 |
| `web/src/app/[locale]/page.tsx` | `<Club />` + `<CommerceStrip />` |
| `web/src/components/layout/footer.tsx` | Wordmark 28px sin subline; redes; 3 cols; copyright bar |
| `web/src/components/layout/whatsapp-fab.tsx` | `border-canvas/20` |
| `web/src/i18n/messages/{es,en}.json` | `home.club.*`, `home.commerce.*`, `footer.*` |
| `web/src/i18n/routing.ts` | `/registro` → register; `/cuenta` → account |
| `web/src/i18n/__tests__/messages.test.ts` | Allowlist: kicker, VIP15 |
| `web/src/components/home/__tests__/home.test.tsx` | Club + franja |
| `web/src/components/layout/__tests__/footer.test.tsx` | Columnas, redes, copyright, sin WhatsApp |
| `web/src/components/layout/__tests__/whatsapp-fab.test.tsx` | Clase de borde |
| `web/e2e/home.spec.ts` | h2 club, 3 celdas, footer oro/redes; un solo h1 |

`catalogUrl` / `Link` nativo para los filtros de familia del footer (ADR-0007):
`/catalogo?family=ambar-especias` y `?family=gourmand`.

## 3 · Layout (del HTML del prototipo)

### Club

```
section.bg-ink.text-canvas.border-b.border-canvas/12
  grid  lg:grid-cols-2
    left  px-gutter py-section  gap-6
      kicker  font-mono text-[24px] text-accent-gold uppercase tracking-[0.2em]
      h2  text-h2 font-display
      body  text-body-l text-canvas/80 max-w-[44ch]
      flex flex-wrap gap-3.5
        Link /registro  bg-canvas text-ink  px-7 py-4  (hover gold, RNF-2 fill)
        Link /ingresar  border-canvas/35 text-canvas  min-h-11
    right  border-l-canvas/18  4 filas
      índice  font-mono text-[24px] text-accent-gold
      título  text-h5 font-display
      desc  text-body-s text-canvas/70
```

El prototipo usa kicker e índice a 10px gold. Acá van a 24px (spec RF-5 / RNF-2).

### Franja

Mismo grid hairline que `services.tsx` / familias. Kicker gold ≥24px, título
`text-h3` o 26px display, cuerpo `text-body-m text-text-muted`.

### Footer

```
footer.bg-ink
  pad  clamp(44→66) gutter, pb-30
  grid  xl:grid-cols-[1.4fr_1fr_1fr_1fr]  pb-11  border-b border-canvas/16
    marca  Wordmark 28px sin subline + blurb + socials (mono 10px, underline canvas/30)
    3 nav  título gold ≥24px; links text-[13.5px] font-light text-canvas/78  min-h-11
  bar  pt-22  flex justify-between  font-mono text-mono-meta uppercase text-canvas/55
```

Links del footer **no** van en `text-label` uppercase: eso es lo que hoy se lee
más pesado que el prototipo. El hit area se salva con `min-h-11 inline-flex
items-center`, no agrandando el glifo.

### FAB

Añadir `border border-canvas/20` a las clases actuales.

## 4 · i18n y rutas

```ts
"/registro": { es: "/registro", en: "/register" },
"/cuenta": { es: "/cuenta", en: "/account" },
```

`/ingresar`, `/contacto`, `/sets`, `/carrito`, `/catalogo` ya existen.
El catch-all sigue 404-ando las que no tienen `page.tsx`.

`home.club.kicker` y `home.club.benefits.vip15` (o el título «VIP15 coupon» vs
«Cupón VIP15») van a la allowlist de `messages.test.ts` sólo si el string es
idéntico.

## 5 · Datos / API

Ninguno. El 5% de socio de la copy del club es independiente del 5% desde
$100.000 de la barra / de la franja mayorista. No se escribe lógica de descuento.

## 6 · Trade-offs

| Opción | Se elige | Por qué |
|--------|----------|---------|
| CTAs de club a `/registro` e `/ingresar` | Sí | Capture + prototipo. Header ya 404a `/ingresar` |
| CTAs a WhatsApp | No | El banner dejaría de ser de cuenta |
| Redes con href del prototipo | Sí | Fuente de diseño; T044 las omitió por no tenerla |
| Legales como `<a>` a URLs inventadas | No | El prototipo es un `<span>`. Convención: no inventar |
| Columna WhatsApp en el footer | No | El prototipo no la tiene; el FAB es el canal |
| Oro a 10px como el prototipo | No | RNF-2 + axe. Oro a ≥24px |
| Quitar Services T054 | No | El usuario pidió la franja *bajo* el club, no borrar la de arriba |

## 7 · Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Títulos gold 24px rompen 360px | Medio | Fallback no-texto de la spec |
| Visitante cree que VIP15 ya aplica | Bajo/alto | RF-1: copy only |
| `sparks.insumos` no es la cuenta final | Bajo | Está en el prototipo; se cambia si el negocio dice otra |
| Footer links 13.5px + `min-h-11` no «se ven» como el proto | Cosmético | Priorizar hit area (AC-15) |

## 8 · Test

| AC | Dónde |
|----|--------|
| AC-1, AC-2 | `home.test.tsx` + `e2e/home.spec.ts` |
| AC-3 | `home.test.tsx`: 3 headings/celdas de la franja |
| AC-4, AC-5 | `footer.test.tsx`: nav Tienda/Cuenta/Ayuda, 3 redes, copyright, `queryByRole('link', {name: /WhatsApp/})` null en el footer |
| AC-6 | `whatsapp-fab.test.tsx`: `toHaveClass` incluye `border-canvas/20` |
| AC-7 | lint + `messages.test.ts` + routing `/registro` `/cuenta` |
| AC-8 | `expectNoA11yViolations` en Club, CommerceStrip, Footer |
| AC-9 | E2E touch + copy de 001 (ya barren `/es` `/en`) |

Gate: `docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run verify`
y `… run --rm e2e`. Tras tocar el layout (footer + FAB), **reiniciar `web`**
antes del E2E (lesson: Turbopack no siempre recompila el chrome).

## 9 · Fuera de este plan

T083, `api/`, páginas de cuenta/contacto, legales con destino real, y el resto
de la home (hero, familias, destacados, Services T054).
