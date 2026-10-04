# Constitution

Non-negotiable principles that govern all development. Every plan and
implementation is checked against these. Change them deliberately, not casually.

## Default principles (edit per project)

1. **Context first.** Read `.ai/` before acting; persist changes after. Never let
   knowledge live only in a chat.
2. **Verify before done.** No iteration is complete until `.cursor/verify.json`
   checks pass. Fix root causes, never disable tests to go green.
3. **Small, reversible steps.** Prefer incremental, reviewable changes.
4. **Simplicity.** Choose the simplest design that meets the requirement. Justify
   added complexity or new dependencies in an ADR.
5. **Traceability.** Every technical choice traces to a requirement (`specs/`) and,
   when non-obvious, to a decision (`decisions/`).
6. **Security & privacy by default.** No secrets in source; validate all external
   input; least privilege.
7. **Consistency over novelty.** Match existing patterns; don't reinvent.

## Project-specific principles

Facts from the live shop ([sparksinsumos.com](https://sparksinsumos.com/),
2026-09-23). A plan that contradicts these needs an explicit business change,
not a silent override.

8. **Piso de compra.** El carrito no cierra (ni arma el WhatsApp de pedido)
   por debajo de **$30.000 ARS** de mercadería, sin el envío. Quiénes Somos
   dice $50.000; hasta que unifique el negocio, rige el mínimo del carrito.
9. **Descuentos, tres instrumentos.** Sobre el subtotal, sin el envío:
   5% desde $100.000 y 10% desde $300.000, automáticos; 5% permanente del
   socio (Sparks Club); cupón que crea el backoffice (porcentaje o monto
   fijo en ARS, tope de usos, vencimiento, todos o sólo socios). Los
   códigos de la maqueta no son códigos vivos. El diseño no dice si se
   suman: hasta esa regla, no se acumulan.
10. **Envío a cargo del comprador.** Correo Argentino o Via Cargo, a cotizar
    por tamaño y peso. No prometer envío gratis. El texto default de
    Ajustes («Correo Argentino · transporte a cotizar») es editable y no
    borra a Via Cargo.
11. **Medios de pago.** Los define Ajustes del backoffice. El diseño los
    deja habilitados: tarjeta hasta 3 cuotas sin interés, transferencia y
    efectivo al retirar. Un medio apagado no se ofrece. El CBU de la
    maqueta no es una cuenta publicada. Sin esos ajustes en la API, el
    storefront no cobra con tarjeta.
12. **Identidad y consumidor.** Pie de página: Sparks Insumos, CUIT
    `20-95827720-3`. Defensa =
    `https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario`.
    Arrepentimiento = el flujo de cancelación de la tienda (hoy
    `/contacto/?order_cancellation_without_id=true` en el dominio vivo). No
    inventar otras URLs legales.
13. **Inspiraciones.** Si el SKU es réplica o inspiración, la UI lo dice.
    No atribuir la venta a la casa de diseñador.
14. **Operator is not customer.** Every account has exactly one role
    (`admin`, `sales`, or `customer`). Grants come from a seeded
    permission catalog (controller + method, or method-less
    `backoffice_access` / `change_backoffice_access`). A store account
    does not enter the panel just by existing: the role must hold
    `backoffice_access`. Permission denials look like missing auth
    (opaque 401). Soft delete uses `deleted_at`; `active = false` is
    block-without-delete. See [020](specs/020-roles-permissions/spec.md),
    [ADR-0027](decisions/0027-rbac-catalogo-y-denegacion-opaca.md),
    [ADR-0028](decisions/0028-soft-delete-deleted-at.md).
15. **Stock.** Bajo = 1 a 3 unidades. Agotado = 0. Esa alerta es la del
    resumen y la de la ficha. Destacados de la home: máximo 4, sólo
    publicados.
16. **Pedido.** Estados: pago pendiente, preparando, enviado, entregado,
    cancelado. No hay otros. Enviado y entregado llevan tracking.
17. **Diseño del backoffice.** Única fuente:
    `https://claude.ai/artifact/NtzZJG94zfZrj3LpMvAtS9` (leída 2026-09-28).
    Las filas de ejemplo no son catálogo, pedidos, cupones, ventas ni
    CBU. La vidriera sigue en el PDF y en el artefacto
    `QUUhcHp24QBtXkUG8sHPDj`.
