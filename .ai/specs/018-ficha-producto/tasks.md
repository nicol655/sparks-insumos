# Tasks · 018 La ficha sigue el artefacto

- **Estado:** cerrada (T359–T366)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0025](../../decisions/0025-ficha-sin-datos-inventados.md)

Vitest de `web` corre con `--no-deps`. No hay pytest: `api/` no cambia.
Cada tarea de comportamiento se escribe en el test y después el mínimo
de código que la pone verde.

## Foundational

- [x] **T359 · Copy del artefacto** → AC-4, AC-6, AC-7
  `web/src/i18n/messages/es.json` y `en.json`.
  Cuotas, «Consultar este perfume», el mensaje `whatsapp.thisPerfume`,
  los tres cuerpos del acordeón (títulos incluidos), el empty state de
  relacionados y el separador de la miga.
  El inglés es el del diccionario del artefacto.
  `messages.test.ts`: `product.crumbSep` entra en la lista de cadenas
  iguales, porque `/` no se traduce.
  `getRelated` no se toca.

## US-1 · La ficha con los datos del GET

- [x] **T360 · Miga, kicker y título** `[P]` → AC-1, AC-2, AC-8
  Depende de T359.
  `web/src/components/product/product-intro.tsx` y
  `__tests__/product-intro.test.tsx`.
  Miga: Inicio y Catálogo enlazan, el nombre no. `h1` es el nombre.
  Debajo, `product.description`.
  Kicker `GOLD_KICKER`: marca y `families.<slug>`, unidos con ` · `.
  Parte vacía se omite. Slug que no es familia no se imprime.
  Sin marca y sin familia no hay kicker, y el nombre y la descripción
  siguen.

- [x] **T361 · Galería** `[P]` → AC-3
  No depende del copy.
  `gallery.tsx` y `__tests__/gallery.test.tsx`.
  `gallerySources` rellena con `null`, no con el packshot.
  La foto grande arranca en `images.packshot`. Un clic en una
  miniatura con URL la muestra; el segundo clic vuelve al packshot.
  Una ranura `null` no es botón.

- [x] **T362 · Fila de precio y consulta** `[P]` → AC-4, AC-8
  Depende de T359.
  `purchase-block.tsx` y `__tests__/purchase-block.test.tsx`.
  Precio con el formato de hoy, frase de cuotas, `StockBadge` sólo si
  `stock` es un número (tinta, no `text-success`).
  `stock: null`: stepper, agregar y «Consultar este perfume» a `wa.me`
  del número configurado. `stock: 0`: el enlace de stock de hoy, sin
  agregar y sin el segundo WhatsApp. Stock mayor a 0: «En stock».

- [x] **T363 · Layout de la página** → AC-1, AC-7
  Depende de T360, T361, T362, T364 y T365.
  `web/src/app/[locale]/catalogo/[slug]/page.tsx`.
  Miga a ancho completo. Dos columnas desde `lg`, galería adhesiva
  desde `xl` a `top: 74px`, raya entre columnas. Columna de info con
  el padding del artefacto: intro, compra, pirámide, datos, acordeón.
  Sigue pidiendo `getProduct` y `getRelated`.
  `generateStaticParams` conserva el guard de 017 (`API_MODE`) para no
  congelar el catálogo en el build. El render de la ficha no bifurca
  por ese modo.

## US-2 · Sin datos inventados

- [x] **T364 · Pirámide, datos y acordeón** `[P]` → AC-5, AC-6
  Depende de T359 para el copy del acordeón. La pirámide y la grilla
  pueden ir en paralelo con T360.
  `olfactive-pyramid.tsx`: grilla de 1px. Sin notas, no se monta. El
  test que ya cubre el vacío se queda.
  `spec-table.tsx` y su test: sólo concentración y tamaño, sin heading.
  No aparecen Duración, Estela, Ocasión, SKU ni «Eau de parfum».
  Concentración vacía y tamaño null: no hay grilla.
  `details-accordion.tsx` y su test: los tres paneles cerrados. Al
  abrir Descripción, el texto de celofán, no `product.description`.
  Los otros dos cuerpos, en es y en en.

## US-3 · Relacionados vacíos

- [x] **T365 · Sección y empty state** `[P]` → AC-7
  Depende de T359.
  `related.tsx` y `__tests__/related.test.tsx`.
  Siempre el `h2`. Lista vacía: la línea de empty state, sin `list`.
  Con filas: tarjetas de foto, nombre y precio, sin «Agregar».
  No se llama otra ruta. `http-repository` `getRelated` sigue en `[]`.

## Polish

- [x] **T366 · Verify y handoff**
  Depende de T359–T365.
  `npm run verify` de `web` en verde.
  Tildar T359–T366. `.ai/progress.md` con el estado y el siguiente
  paso. La ficha en `architecture.md` deja de decir que la sección se
  esconde. ADR-0024 apunta a 0025 en esa frase.

## Dependencies

```
T359 ──→ T360 [P] ──┐
     ├─→ T362 [P] ──┤
     ├─→ T364 [P] ──┼──→ T363 ──→ T366
     └─→ T365 [P] ──┘
T361 [P] ───────────┘
```

T364 parte el copy (T359) de la pirámide, que no lo necesita. Se
implementa junta para no dejar el acordeón a medias.

## Definition of Done

- T359–T366 tildadas.
- AC-1…AC-8 cubiertos por los tests de la tabla del plan.
- `docker compose -f docker/docker-compose.yml run --rm --no-deps web npm run verify` en verde.
- `.ai/progress.md` actualizado.
