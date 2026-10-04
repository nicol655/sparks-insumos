# Plan técnico · 015 Cajón de producto: sin pirámide, fotos por ranura

- **Estado:** implementado (2026-09-29)
- **Spec:** [`spec.md`](./spec.md)
- **ADRs:** [0022](../../decisions/0022-fotos-del-cajon-por-ranura.md).
  El alta sigue escribiendo sólo 013
  ([ADR-0019](../../decisions/0019-catalogo-backoffice-proxy-y-campos.md),
  [ADR-0021](../../decisions/0021-catalogo-layout-del-artefacto.md)).

## 1 · Enfoque

El cambio es del cajón, en el cliente. No hay columna nueva ni otro
`POST`.

Se borra el grupo «Pirámide olfativa». Esos tres inputs no tenían
`name` ni estado: no viajaban. Quitarlos no cambia el cuerpo.

Las cuatro ranuras dejan de ser un adorno. Cada una es un `<label>` con
`cursor-pointer` y un `<input type="file">` escondido (`sr-only`), sin
`multiple`, con el mismo `accept` de hoy (`image/jpeg`, `image/png`,
`image/webp`). El clic del cuadro es el clic del label: abre el
selector del sistema. El input visible de «Choose Files» sale, y con él
`PHOTO_HINT`, que dice que se pueden arrastrar.

El estado pasa de `File[]` a una ranura por nombre de `IMAGE_SLOTS`,
con `File | null`. Al guardar, `photos` es esa lista sin los `null`,
en el orden Packshot frontal → Atomizador → Notas → Lifestyle.
`validateDraft` no se entera de los roles: sigue recibiendo `File[]`.

El preview es un `<img>` con `URL.createObjectURL`. Al reemplazar o al
desmontar, `URL.revokeObjectURL`. La imagen llena el marco 4:5
(`object-cover`). El nombre va en un párrafo debajo del marco, no
adentro. `title` guarda el nombre completo.

El corte del nombre es una función pura, no un `text-overflow` sobre el
string entero: eso se comería la extensión. El presupuesto es 17
caracteres, que es el largo del ejemplo de la spec y entra en el cuadro
(~120 px, mono 8.5 px, cajón de 560 px con padding de 26 px y cuatro
columnas). jsdom no mide el cuadro; el presupuesto es el límite.

## 2 · Archivos

| Archivo | Cambio |
|---------|--------|
| `backoffice/src/lib/catalog/labels.ts` | `shortenFileName` y el presupuesto 17. `IMAGE_SLOTS` queda |
| `backoffice/src/lib/catalog/__tests__/labels.test.ts` | El ejemplo largo, un nombre corto y uno sin extensión |
| `backoffice/src/components/catalog/product-form.tsx` | Sin pirámide. Cuatro labels. Sin el input suelto ni `PHOTO_HINT` |
| `backoffice/src/components/catalog/__tests__/product-form.test.tsx` | AC-1…AC-6 de esta spec |

`form.ts`, `client.ts`, el proxy, `api/` y `web/` no se tocan. El test
de `validateDraft` que rechaza nueve archivos se queda: la función
sigue pudiendo recibirlos aunque el cajón no los arme.

## 3 · Nombre del archivo

```txt
shortenFileName(name, 17)

cabe entero          → name
hay extensión        → prefijo + "... " + extensión
no hay extensión     → prefijo + "..."
```

La extensión es desde el último punto, si el punto no es el primer
carácter. `nombre_muy_largo_para_el_cuadro.png` → `nombre_mu... .png`.
`perfume 1.webp` (15) queda igual. El espacio antes de la extensión es
el del ejemplo; no es un `…` tipográfico.

El párrafo usa `font-mono text-[8.5px]`, `truncate` no hace falta
porque el string ya viene cortado, y `title={name}`.

## 4 · Preview y envío

| Ranura | Archivo | Qué se manda |
|--------|---------|--------------|
| Vacía | `null` | nada |
| Con archivo | `File` | un part `photos`, en el orden de `IMAGE_SLOTS` |

Un segundo archivo en la misma ranura reemplaza al primero y revoca la
URL anterior. No hay control para dejar la ranura vacía otra vez.

Cero archivos: el mismo aviso «Fotos» de 014, sin `createProduct`. Un
archivo grande o de otro tipo: el texto de 013, también sin envío. Esos
dos casos ya los decide `validateDraft`.

## 5 · Tests

Vitest del backoffice, `--no-deps`, sin Postgres y sin AWS.

| AC | Dónde |
|----|--------|
| 1 | El formulario no tiene esos cuatro textos |
| 2 | `cursor-pointer` en cada cuadro. Subir en el primero no pone nombre en los otros |
| 3 | Tras `userEvent.upload`, hay un `img` y el texto `perfume 1.webp` |
| 4 | El caso largo sale de `shortenFileName` y se ve bajo el cuadro |
| 5 | `createProduct` recibe `photos` en orden de ranura, sin huecos, y el cuerpo no tiene campos de pirámide |
| 6 | Alta sin fotos, y un archivo que no es imagen, no llaman al cliente |
| 7 | Diff vacío en `web/` y `api/` |

`URL.createObjectURL` en jsdom se reemplaza en el test del formulario
por una función que devuelve `blob:preview`. Si no, el `img` no tiene
`src`.

## 6 · Riesgos

- El presupuesto de 17 no es una medida en vivo. Un cajón más angosto
  puede hacer que `nombre_mu... .png` igual se salga. El `title` sigue
  teniendo el nombre entero.
- Como máximo salen cuatro fotos, aunque 013 acepte ocho. Quien necesite
  la quinta tiene que esperar otra spec: esta pantalla no tiene quinta
  ranura.
- El rol (packshot, atomizador, notas, lifestyle) sólo existe en el
  orden de los parts. La API no lo distingue.
