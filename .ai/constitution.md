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
9. **Descuento por monto, no por código.** 5% desde $100.000 y 10% desde
   $300.000 son automáticos sobre el subtotal. Un cupón (T083) no se inventa
   ni se acumula con esos tramos hasta que existan reglas escritas.
10. **Envío a cargo del comprador.** Correo Argentino o Via Cargo, a cotizar
    por tamaño y peso. No prometer envío gratis.
11. **Pago vivo.** Efectivo o transferencia/depósito. Tarjeta o cuotas sólo
    si el negocio las habilita; el prototipo no alcanza para implementarlas.
12. **Identidad y consumidor.** Pie de página: Sparks Insumos, CUIT
    `20-95827720-3`. Defensa =
    `https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario`.
    Arrepentimiento = el flujo de cancelación de la tienda (hoy
    `/contacto/?order_cancellation_without_id=true` en el dominio vivo). No
    inventar otras URLs legales.
13. **Inspiraciones.** Si el SKU es réplica o inspiración, la UI lo dice.
    No atribuir la venta a la casa de diseñador.
