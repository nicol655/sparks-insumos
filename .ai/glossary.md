# Glossary

Domain terms as the storefront uses them. Spanish is the default locale (`es-AR`).

- **Familia olfativa** — grouping of a fragrance by its dominant character (floral, amaderada, oriental, fresca, gourmand, …). Travels as a slug in the API and URL (`?family=`); the label is translated in the dictionary. Home tiles and catalog chips are the same list from `getFacets()`.
- **Pirámide olfativa** — the three layers of notes on the product page: salida (top), corazón (heart), fondo (base). Rendered by `olfactive-pyramid.tsx`.
- **Concentración** — how much perfume oil the juice carries (EDP, extrait, …). Travels as a slug; the label is translated. Shown in the spec table, not as a catalog facet in Fase 1.
- **Packshot** — the hero still of the bottle. Product gallery is 4:5 plus three 1:1 thumbs (`gallery.tsx`). Cards use the same asset via `packshot.tsx`. Until real photos exist, a diagonal placeholder from §05 stands in; `srcset` 400/800/1200/1600 is already wired.
- **Nota** — a single smell listed on the pyramid or used as a search suggestion chip.
- **Facet** — a filterable dimension of the catalog (family, brand, size) plus its result count. Price is a range, not a chip.
- **Chip** — rounded-pill control (`--radius-chip`). Toggle filters use `aria-pressed`; a combination that would empty the grid becomes a 40% `span`, not a link (RF-2).
- **Overlay** — the single UI slot for cart drawer, search, mobile menu, or filter drawer. Opening one closes the other (`useUiStore`).
- **Canvas / ink** — the two ground colors of the system: warm bone (`#F5F1EA`) and near-black (`#14100E`). Gold (`accent-gold`) is an accent, not body text.
