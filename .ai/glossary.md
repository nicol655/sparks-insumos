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
- **Sparks Insumos** — legal / storefront name on [sparksinsumos.com](https://sparksinsumos.com/). CUIT `20-95827720-3`. The new UI brand is **Sparks Parfums**; same business.
- **Sparks Mayorista** — how the live home and Quiénes Somos address the buyer (revendedoras y negocios). Minimum order and volume discounts apply to this motion.
- **Insumo** — a unit sold for resale (perfume, make-up, skincare, accessory), not a finished retail experience. Makeup ships in **tonos surtidos**.
- **Inspiración / réplica 1:1** — live-catalog labels for fragrances that evoke a designer scent. Not the designer’s own juice. Do not drop the qualifier in copy.
- **Mínimo de compra** — checkout floor **$30.000 ARS** excluding shipping (Tiendanube cart rule and home). Quiénes Somos still says $50.000; that page is stale relative to the cart.
- **Descuento por volumen** — automatic 5% from $100.000 and 10% from $300.000. Not a typed coupon. Separate from T083.
- **Botón de arrepentimiento** — Argentine cooling-off control. Live destination: `/contacto/?order_cancellation_without_id=true` on sparksinsumos.com.
- **Defensa del consumidor** — live link to the national form: `https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario`.
- **Franklin** — published address / showroom (CABA). Pickup and “retiro” copy refer here, not Palermo.
- **Via Cargo** — the second shipper next to Correo Argentino. Buyer pays; quote by size and weight.
- **Cuenta** — a person registered on `api/` (spec 007, not built). Identified by email and password. The storefront routes `/registro`, `/ingresar` and `/cuenta` are still unwired.
- **`active`** — user row flag. `false` means logically deleted: the row stays, login fails, and the email cannot be registered again.
- **`must_change_password`** — user row flag. Login still issues a session, but every other authenticated call returns 403 `password_change_required` until `POST /auth/change-password`. The bootstrap user is created with this flag set.
