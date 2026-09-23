# Business Model

Fuente leída el 2026-09-23: tienda viva
[sparksinsumos.com](https://sparksinsumos.com/) (Tiendanube, store `003/241/961`).
El storefront en `web/` (Sparks Parfums) es el reemplazo en curso de esa tienda,
no un negocio aparte.

## Value proposition

Sparks Mayorista vende **insumos de belleza al por mayor** (perfumes árabes y
de inspiración, maquillaje, skincare y accesorios) a revendedoras y comercios
de toda Argentina, con piso de compra, descuento por volumen y envío nacional.

Frase de la home: «Belleza y estilo al mejor precio». Quiénes Somos: «Insumos
de belleza que potencian tu negocio».

## Customer segments

- **Comprador (B2B):** revendedoras y negocios de belleza de todo el país.
  Quiénes Somos: «Hace 3 años trabajamos con revendedoras y negocios de todo
  el país.»
- **Usuario final:** quien usa o revende el producto. No es el comprador
  típico: el carrito exige un mínimo y el maquillaje se envía en **tonos
  surtidos**.
- **Cuenta:** crear cuenta / iniciar sesión para «comprar más rápido y seguir
  pedidos» (Tiendanube). El prototipo nuevo reserva `/registro`, `/ingresar`,
  `/cuenta` (Fase 2).

## Problem / jobs-to-be-done

- Reponer stock de belleza (perfume, make-up, facial, accesorios) sin ir a un
  mayorista físico.
- Armar un pedido que llegue a cualquier provincia, pagando envío a cotizar.
- Comprar por encima de un piso y acceder al descuento por monto.
- Consultar stock, tonos y el pedido por WhatsApp cuando el catálogo no alcanza.

## Solution & key features

Catálogo vivo (cuatro familias):

| Familia | Recorte en el sitio |
|---------|---------------------|
| Perfumes | Femeninos / masculinos. Marcas árabes (Lattafa, Afnan, Bharara, Paris Corner, V.V Love, Hawas, Kayali listada) + «inspiración» de diseñador + sets de miniaturas. Algunas fichas dicen «Réplicas 1:1, nuevos y sellados.» |
| Maquillaje | TEI Cosmética, Pink21. Tonos surtidos. |
| Cuidado facial & corporal | Originales (Skin1004, Mixsoon) y líneas de volumen (Sadoer, Bioaqua, Kiss Beauty, KOEC). |
| Accesorios de belleza | Espejos LED, rodillo de jade, etc. |

Operación:

- Pedido en Tiendanube **o** WhatsApp (`541168692694`).
- Retiro / showroom en **Franklin** (CABA). Envíos Correo Argentino y Via Cargo,
  a cotizar por tamaño y peso, **a cargo del comprador**.
- Pago: efectivo o transferencia/depósito. El footer no ofrece tarjeta.
- Newsletter, Instagram / Facebook / TikTok `@sparks.insumos`.

El storefront nuevo (`web/`) recorta Fase 1 a **perfumería** editorial, cierra
el carrito por WhatsApp (sin pasarela) y deja maquillaje / skincare / checkout
online para más adelante.

## Revenue model & pricing

Venta de mercadería en **ARS**. Sin suscripción.

| Regla | Fuente | Monto |
|-------|--------|-------|
| Mínimo de compra (sin envío) | Home + regla del carrito Tiendanube | **$30.000** |
| Mínimo (copy de Quiénes Somos) | `/quienes-somos/` | $50.000 — **difiere**; el carrito aplica $30.000 |
| 5% off automático | Barra de anuncio | desde $100.000 |
| 10% off automático | Barra de anuncio | desde $300.000 |
| Cupón de código | Campo en el carrito Tiendanube | códigos no publicados. Bloquea T083 |

Precios de lista (muestra 2026-09-23): miniaturas ~$6.800; EDP 100 ml
~$24.000–$48.000; sets 4–5 pcs ~$34.000; skincare original Skin1004
~$25.000–$42.000; make-up / accesorios desde ~$2.700.

El prototipo nuevo menciona «hasta 3 cuotas sin interés» y tarjeta. **Eso no
está en la tienda viva** (efectivo / transferencia; el carrito dice «hasta 1
cuota»).

## Key metrics (North Star + supporting)

La tienda no publica KPIs.

- **North Star (inferido, no confirmado):** pedidos mayoristas cobrados con
  subtotal ≥ mínimo. Contar pedidos y GMV de esos pedidos.
- **Supporting (observables en el sitio):** tasa de pedidos ≥ $100.000 / ≥
  $300.000 (disparan el 5/10%); % de pedidos por WhatsApp vs Tiendanube;
  cuentas creadas; stock de SKUs estrella; suscriptores del newsletter.

## Market & competition

- **Hoy:** Tiendanube propio + WhatsApp + redes. Alternativa obvia para el
  comprador: Mercado Libre, otros mayoristas de perfume árabe / réplica /
  insumos de belleza.
- **Diferencia declarada:** piso bajo para emprender, envío nacional, mix
  perfume + make-up + skincare, showroom Franklin, trato por WhatsApp.
- La web no nombra competidores ni share.

## Constraints & compliance

Identidad (footer 2026):

- Razón / marca fiscal: **Sparks Insumos**
- CUIT: **20-95827720-3** (el footer lo imprime `20958277203`)
- Tel: `011 6869-2694` → `wa.me/5491168692694`
- Email: `sparksinsumos@gmail.com`
- Domicilio publicado: Franklin, CABA

Consumidor (Ley 24.240). Destinos **ya usados** en la tienda viva — no
inventar otros:

- Defensa: [formulario nacional](https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario)
- Arrepentimiento: [contacto + cancelación Tiendanube](https://sparksinsumos.com/contacto/?order_cancellation_without_id=true)

Cookies: banner de consentimiento al entrar.

Copy de perfume: varias SKU se venden como **inspiración** o **réplica 1:1**.
No presentar casas de diseñador como el vendedor.

## Go-to-market

- Sitio: `sparksinsumos.com` (hasta que `web/` lo reemplace).
- Redes: [instagram.com/sparks.insumos](https://instagram.com/sparks.insumos),
  [facebook.com/sparks.insumos](https://www.facebook.com/sparks.insumos),
  [tiktok.com/@sparks.insumos](https://www.tiktok.com/@sparks.insumos).
- WhatsApp FAB + número en footer.
- Newsletter (email).
- Showroom Franklin.

Posicionamiento vivo: mayorista de insumos. Posicionamiento del prototipo
nuevo: «Sparks Parfums», editorial de lujo, bilingüe es-AR / en.

## Risks & assumptions

- **Mínimo $30.000 vs $50.000.** El carrito cobra $30.000. Quiénes Somos
  sigue diciendo $50.000. Hasta que el negocio unifique, el producto usa
  **$30.000**.
- **«Desde 2019»** (copy del prototipo) vs **«hace 3 años»** en Quiénes
  Somos (~2023). No hay año fundacional único.
- **Cierre:** hoy hay checkout Tiendanube + WhatsApp. El storefront nuevo
  cierra solo por WhatsApp (decisión de producto, no del sitio vivo).
- **Envío:** el footer dice a cargo del comprador; las tarjetas de producto
  muestran badge «Envío gratis». La regla de negocio es la del footer.
- **Tarjeta / 3 cuotas** del prototipo no existen en la tienda viva.
- **Réplicas / inspiraciones:** riesgo de marca y de reclamo. El catálogo
  nuevo no debe borrar esa calificación si el SKU la tiene.
- **Alcance:** Fase 1 del storefront es perfume. El negocio real vende
  cuatro familias; recortar make-up/skincare es un recorte de producto, no
  del modelo.
- T083 (cupón) sigue sin códigos ni reglas de acumulación con el 5/10%.

## Glossary link

Términos en `glossary.md`. Principios duros (mínimo, descuentos, legales,
CUIT) también en `constitution.md`.
