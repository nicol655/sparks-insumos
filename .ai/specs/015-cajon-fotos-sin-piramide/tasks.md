# Tasks · 015 Cajón de producto: sin pirámide, fotos por ranura

- **Estado:** cerrada (T340–T342)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0022](../../decisions/0022-fotos-del-cajon-por-ranura.md)

No se toca `web/` ni `api/`. No hay dependencia nueva. Cada tarea de
comportamiento se escribe en rojo y después el mínimo de código que la
pone verde. Vitest corre en Docker con `--no-deps`.

## Setup

- [x] **T340 · Corte del nombre** `[P]` → US-3, AC-4
  Puede ir sola. No la importa el formulario hasta T341.
  `backoffice/src/lib/catalog/labels.ts`: `shortenFileName` con
  presupuesto 17. Cabe entero → el nombre. Con extensión → inicio,
  `...`, un espacio y la extensión. Sin extensión → inicio y `...`.
  `nombre_muy_largo_para_el_cuadro.png` → `nombre_mu... .png`.
  `perfume 1.webp` queda igual.
  Test primero en `backoffice/src/lib/catalog/__tests__/labels.test.ts`.

## US-1 · US-2 · US-3 · Cajón

- [x] **T341 · Ranuras y sin pirámide** → US-1, US-2, US-3, AC-1…AC-6
  Depende de T340.
  `backoffice/src/components/catalog/product-form.tsx`.
  Quitar el grupo «Pirámide olfativa» y los tres inputs. Quitar el
  `<input type="file" multiple>` y `PHOTO_HINT`.
  Cada ítem de `IMAGE_SLOTS` es un `<label class="cursor-pointer">` con
  un file input escondido, sin `multiple`, `accept` jpeg/png/webp.
  Al elegir, el cuadro muestra `<img>` (`object-cover`, 4:5) vía
  `URL.createObjectURL`, y debajo el nombre ya cortado con `title` al
  nombre entero. Reemplazar revoca la URL anterior. Al desmontar,
  también.
  `photos` del alta es esa lista sin huecos, en el orden de las ranuras.
  `validateDraft` no cambia.
  Test primero en
  `backoffice/src/components/catalog/__tests__/product-form.test.tsx`.
  `URL.createObjectURL` se sustituye por `blob:preview`. Los tests que
  hoy suben a «Fotos» pasan a «Packshot frontal».

## Polish

- [x] **T342 · Verify y handoff** → AC-7
  Depende de T340 y T341.
  `docker compose -f docker/docker-compose.yml run --rm --no-deps backoffice npm run verify`.
  Arreglar la causa. Tildar esta lista. `plan.md` pasa a implementado.
  `architecture.md` y `progress.md` dicen que el cajón ya no muestra la
  pirámide y que cada cuadro elige su foto. `web/` y `api/` sin cambios.

## Dependencias

```
T340 [P] ──→ T341 (US-1, US-2, US-3) ──→ T342
```

## Definition of Done

- T340–T342 tildadas. Vitest del backoffice: 104 tests.
- AC-1…AC-6 cubiertos por Vitest dentro del contenedor `backoffice`,
  sin Postgres y sin AWS.
- `npm run verify` del backoffice en verde (`--no-deps`).
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- `web/` y `api/` sin cambios.
