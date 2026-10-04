# Tasks · 016 Edición de producto, miniatura y visibilidad

- **Estado:** cerrada (T343–T350)
- **Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
- **ADRs:** [0023](../../decisions/0023-miniatura-y-patch-por-ranuras.md)

`web/` no se toca. Pytest de la API usa el doble en memoria. Vitest del
backoffice corre con `--no-deps`. Cada tarea de comportamiento se
escribe en rojo y después el mínimo de código que la pone verde.

## Foundational

- [x] **T343 · Firma de lectura** `[P]` → AC-1, lado API
  Puede ir antes del panel.
  `api/app/storage.py`: `presign_get` en el puerto. S3 firma
  `get_object` con `ExpiresIn=3600` y el cliente que ya usa `put`.
  Sin bucket o sin claves, lanza. `api/tests/fakes.py`:
  `memory:{clave}`.
  Test primero en `api/tests/unit/test_s3_client.py`: bucket, clave y
  3600, sin red.

- [x] **T344 · `photo_urls`** → AC-1
  Depende de T343.
  `api/app/schemas/catalog.py`: `photo_urls` en `ProductPublic`.
  `to_audit` lo saca.
  `api/app/api/routes/products.py`: GET, POST y PATCH firman cada clave.
  Si una firma falla, esa entrada es `""` y el listado sigue en 200.
  Pytest: la respuesta trae `memory:` más la clave, y la auditoría no
  contiene `memory:`.

- [x] **T345 · PATCH por ranuras** → AC-6
  Depende de T344.
  `api/app/api/routes/products.py`. `photo_slots` presente: la lista es
  `slot_key_0..7` y `slot_file_0..7`, sin huecos. El archivo gana si
  vienen los dos. Cero ranuras, clave ajena o repetida: 422
  `photos_rejected`, sin `put` ni `delete`. Al commitear se borran las
  claves que salieron. Sin `photo_slots`, el `PATCH` de 013 sigue.
  `tags_present=1` permite dejar los tags vacíos; sin ese campo, omitir
  `tag_ids` no los toca.
  Test primero en `api/tests/e2e/test_catalog.py`: visibilidad sola,
  reemplazo de una ranura, cola `slot_key_4`, plan vacío, clave ajena.
  El `POST` sin fotos sigue en 422.

- [x] **T346 · Proxy del PATCH** `[P]` → AC-3, AC-7
  No depende de la API. Puede ir con T343.
  `backoffice/src/lib/catalog/proxy.ts`: `forwardProductPatch`. El id
  es un UUID; si no, 404. Upstream `PATCH /products/{id}`, cuerpo y
  `Content-Type` incluidos. 401 y 502 como el POST.
  `backoffice/src/app/api/catalog/products/[id]/route.ts` sólo exporta
  `PATCH`.
  Test primero en `backoffice/src/lib/catalog/__tests__/proxy.test.ts`.

## US-1 · US-2 · US-3 · US-4 · Panel

- [x] **T347 · Cliente y validación** → AC-3, AC-6
  Depende de T346 para el camino real. El cliente se prueba con fetch
  falso.
  `backoffice/src/lib/catalog/contract.ts`: `photo_urls`.
  `backoffice/src/lib/catalog/client.ts`: `updateProduct(id, FormData, token)`.
  `backoffice/src/lib/catalog/form.ts`: `keptPhotoCount`. Cero archivos
  y cero guardadas sigue faltando «Fotos». Un archivo malo sigue el
  texto de 013 aunque haya una guardada.
  Tests en `contract.test.ts`, `client.test.ts`, `form.test.ts` y los
  fixtures que arman un `Product`.

- [x] **T348 · Listado** → US-1, US-2, US-3, AC-1…AC-4
  Depende de T347.
  `backoffice/src/components/catalog/catalog-list.tsx`.
  `photo_urls[0]` no vacío: `<img alt="" class="h-12 w-10 object-cover">`.
  Vacío: la franja, sin `img`.
  «Editar» es botón `cursor-pointer hover:underline`. Abre el cajón con
  `key` del id.
  Publicado es botón `cursor-pointer`, `aria-pressed` si `visible`.
  El clic manda sólo `visibility`: `visible` → `hidden`; cualquier otro
  → `visible`. Un fallo no cambia la fila. 401 cierra la sesión.
  Test primero en `catalog-list.test.tsx`.

- [x] **T349 · Cajón de edición** → US-2, US-4, AC-2, AC-3, AC-5, AC-6
  Depende de T347 y T348.
  `backoffice/src/components/catalog/product-form.tsx`.
  Con `product`: kicker «Editar producto», botón «Guardar cambios»,
  inputs de 013 precargados, ranuras remotas en orden. Familia, tamaño,
  stock e inglés siguen vacíos.
  Elegir archivo sobre una remota manda `slot_file_i` y no esa
  `slot_key_i`. La papelera (`aria-label="Quitar foto"`,
  `cursor-pointer`) sólo en edición, fuera del `<label>`, vacía la
  ranura y no abre el selector. Cancelar no llama a `updateProduct`.
  Cero fotos no llama al cliente y muestra el aviso. `photo_slots=1`.
  Las claves desde el índice 4 se reenvían. El alta no gana papelera y
  sigue en `createProduct`.
  Test primero en `product-form.test.tsx`.

## Polish

- [x] **T350 · Verify y handoff** → AC-7
  Depende de T343–T349.
  `docker compose -f docker/docker-compose.yml run --rm api uv run pytest`
  y `docker compose -f docker/docker-compose.yml run --rm --no-deps backoffice npm run verify`.
  Ruff del API. Arreglar la causa. Tildar esta lista. `plan.md` pasa a
  implementado. `architecture.md` y `progress.md` dicen que el listado
  muestra la miniatura y que editar usa el `PATCH` por ranuras.
  `web/` sin cambios.

## Dependencias

```
T343 [P] ──→ T344 ──→ T345 ──┐
T346 [P] ──→ T347 ──────────┼──→ T348 ──→ T349 ──→ T350
                             │
                             └──→ T349
```

## Definition of Done

- T343–T350 tildadas.
- AC-1…AC-6 cubiertos por pytest (doble en memoria, sin AWS) y por
  Vitest del backoffice (`--no-deps`).
- `pytest` del API y `npm run verify` del backoffice en verde.
- `.ai/progress.md` actualizado: qué quedó y cuál es el paso siguiente.
- `web/` sin cambios. El bearer no va en la query ni en una cookie.
