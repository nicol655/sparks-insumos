# Business Model

Fuente de la tienda viva, leída el 2026-09-23:
[sparksinsumos.com](https://sparksinsumos.com/) (Tiendanube, store `003/241/961`).

Fuente de la operación interna, leída el 2026-09-28:
[backoffice](https://claude.ai/artifact/NtzZJG94zfZrj3LpMvAtS9).
Es la **única** fuente de diseño del backoffice. Las filas de ejemplo
(clientes, pedidos `SP-…`, cupones, serie de ventas, CBU) son relleno de
la maqueta. No son clientes, códigos ni una cuenta bancaria reales.

`web/` reemplaza la Tiendanube. `backoffice/` es la herramienta con la que
el equipo opera esa tienda.

## Value proposition

Sparks Mayorista vende **insumos de belleza al por mayor** (perfumes árabes y
de inspiración, maquillaje, skincare y accesorios) a revendedoras y comercios
de toda Argentina, con piso de compra, descuento por volumen, precio de socio
y envío nacional.

Frase de la home viva: «Belleza y estilo al mejor precio». Quiénes Somos:
«Insumos de belleza que potencian tu negocio».

El equipo no opera en el admin de Tiendanube. Opera en el backoffice:
pedidos, stock, clientes, cupones, mensajes del formulario, textos del sitio
y las reglas de compra.

## Customer segments

- **Comprador (B2B):** revendedoras y negocios de belleza de todo el país.
  Quiénes Somos: «Hace 3 años trabajamos con revendedoras y negocios de todo
  el país.»
- **Socio (Sparks Club):** cuenta con 5% off permanente, preventas y cupón
  de bienvenida. En el backoffice el nivel se llama Club.
- **Invitado:** cuenta sin ese 5%. Puede comprar. No es socio.
- **Usuario final:** quien usa o revende el producto. El maquillaje de la
  tienda viva se envía en **tonos surtidos**.
- **Equipo:** operadores del backoffice. No son clientes. Tres roles:
  Administración, Logística, Contenido.

## Problem / jobs-to-be-done

Comprador:

- Reponer stock de belleza sin ir a un mayorista físico.
- Armar un pedido que llegue a cualquier provincia, pagando envío a cotizar.
- Comprar por encima del piso y acceder al descuento por monto y, si es
  socio, al 5% permanente.
- Consultar stock, tonos y el pedido por WhatsApp cuando el catálogo no alcanza.

Equipo:

- Ver ventas, pedidos con pago pendiente, stock bajo y mensajes sin responder.
- Llevar un pedido de pago pendiente a entregado, con tracking.
- Publicar o corregir una referencia (precio, stock, textos en español e
  inglés, pirámide, fotos).
- Dar de alta un cliente, pasarlo a Club o bloquear la cuenta.
- Crear un cupón, contestar el formulario y publicar la portada.

## Solution & key features

### Tienda viva

Cuatro familias en sparksinsumos.com: perfumes (árabes, inspiración, sets),
maquillaje, cuidado facial y corporal, accesorios. Retiro en **Franklin**.
Envíos Correo Argentino y Via Cargo, a cargo del comprador. WhatsApp
`5491168692694`. Redes `@sparks.insumos`.

`web/` recorta la vidriera a **perfumería** y cierra el pedido por WhatsApp
hasta que existan los ajustes de pago en la API.

### Backoffice

Navegación del diseño (tres grupos):

| Grupo | Secciones |
|-------|-----------|
| Operación | Resumen, Pedidos, Catálogo, Mensajes |
| Clientes | Usuarios (clientes y equipo), Cupones |
| Sitio | Contenido, Ajustes |

**Resumen.** Ventas del período (7 / 14 / 30 días), pedidos, ticket
promedio, socios del club. Pedidos recientes, stock bajo, mensajes sin
responder. Búsqueda global de pedidos, productos y clientes.

**Pedidos.** Estados: pago pendiente, preparando, enviado, entregado,
cancelado. Pago: tarjeta, transferencia o efectivo. Enviado y entregado
llevan tracking. Exportar CSV. El operador cambia estado y tracking; el
diseño arma un WhatsApp al cliente.

**Catálogo** (el del diseño, no las cuatro familias de Tiendanube):

| Eje | Valores |
|-----|---------|
| Categoría | Perfume, Set, Body splash |
| Familia | Ámbar & especias, Floral, Gourmand, Maderas, Fresco & acuático |
| Para | Mujer, Hombre, Unisex |
| Stock | Unidades. **Bajo** = 1 a 3. **Agotado** = 0 |
| Visibilidad | Publicado o borrador |
| Texto | Descripción en español y en inglés. Sin inglés, el sitio en inglés muestra el español |
| Pirámide | Salida, corazón, fondo |
| Fotos | Packshot frontal, atomizador, notas, lifestyle |

**Usuarios.** Clientes: nombre, apellido, email, teléfono, nivel
(Club o Invitado), estado (activa o bloqueada), notas internas. El equipo
se invita aparte. Borrar un cliente, en el diseño, borra también historial,
nivel y cupones.

**Cupones.** Código, porcentaje o monto fijo en ARS, límite de usos
(0 = sin límite), vencimiento, solo socios o todos, activo o pausado.
Los códigos dibujados en la maqueta no se publican.

**Mensajes.** Bandeja del formulario. Sin responder o respondido. Respuesta
por el panel o por WhatsApp.

**Contenido.** Barra de anuncio, portada y bloque Sparks Club, en español
y en inglés. Destacados de la home: **máximo 4**, sólo publicados.

**Ajustes** (defaults del diseño, 2026-09-28):

| Campo | Default |
|-------|---------|
| Nombre | Sparks Parfums |
| Email | `hola@sparksparfums.com` |
| WhatsApp | `+54 9 11 6869 2694` |
| Retiro | Franklin, CABA · retiro con turno |
| Compra mínima | $30.000 |
| Despacho | 24/48 h hábiles |
| Transportes | Correo Argentino · transporte a cotizar |
| Nivel 1 | 5% desde $100.000 |
| Nivel 2 | 10% desde $300.000 |
| Socio | 5% off permanente |
| Pagos | Tarjeta hasta 3 cuotas sin interés, transferencia, efectivo al retirar. Las tres, habilitadas |
| Idiomas | Español publicado (defecto) e inglés publicado |
| Moneda | ARS |

El CBU que muestra la maqueta es de relleno. No es una cuenta a publicar.

### Roles

| Sección | Administración | Logística | Contenido |
|---------|----------------|-----------|-----------|
| Pedidos | Total | Total | — |
| Catálogo y stock | Total | Solo stock | Textos e imágenes |
| Usuarios | Total | Lectura | — |
| Cupones | Total | — | — |
| Contenido | Total | — | Total |
| Ajustes | Total | — | — |

Una cuenta de la tienda no es un operador.

## Revenue model & pricing

Venta de mercadería en **ARS**. Sin suscripción.

| Regla | Monto | Dónde está escrito |
|-------|--------|--------------------|
| Mínimo de compra, sin envío | **$30.000** | Carrito vivo y ajustes del backoffice |
| Mínimo en Quiénes Somos | $50.000 | Página viva, desactualizada. No rige |
| 5% automático | desde $100.000 | Barra viva y ajustes |
| 10% automático | desde $300.000 | Barra viva y ajustes |
| Socio del club | **5% permanente** | Ajustes del backoffice |
| Cupón | % o monto fijo, con tope, vencimiento y alcance | Lo crea el equipo. No hay códigos vivos |

El diseño no dice si un cupón se suma al 5/10% ni al 5% de socio. Hasta
que exista esa regla, **no se acumulan**.

Medios de pago que el diseño deja habilitados: tarjeta (hasta 3 cuotas sin
interés), transferencia y efectivo al retirar. Apagar uno en Ajustes lo
saca del checkout. No hay pasarela implementada: el storefront sigue
cerrando por WhatsApp.

Precios de lista en la tienda viva (muestra 2026-09-23): miniaturas
~$6.800; EDP 100 ml ~$24.000–$48.000; sets 4–5 pcs ~$34.000.

## Key metrics (North Star + supporting)

La tienda no publica KPIs. El resumen del backoffice fija cuáles mira el
equipo. Los números de la maqueta (barras, «▲ 3,9%», «2 altas») no son
medición.

- **North Star:** ventas del período (importe de pedidos no cancelados).
- **Supporting:** cantidad de pedidos, ticket promedio, socios del club,
  pedidos en pago pendiente, referencias con stock ≤ 3, mensajes sin
  responder.

## Market & competition

Hoy: Tiendanube + WhatsApp + redes. Alternativa del comprador: Mercado
Libre y otros mayoristas de perfume árabe, réplica e insumos. La web no
nombra competidores. Diferencia declarada: piso para emprender, envío
nacional, mix de la tienda viva, showroom Franklin, trato por WhatsApp.

## Constraints & compliance

Identidad fiscal (footer vivo, 2026): **Sparks Insumos**, CUIT
**20-95827720-3**, tel `011 6869-2694`, domicilio Franklin (CABA).
Email de la Tiendanube: `sparksinsumos@gmail.com`. Email del sistema
nuevo (ajustes): `hola@sparksparfums.com`.

Consumidor (Ley 24.240). Destinos ya usados, no inventar otros:

- Defensa: [formulario nacional](https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario)
- Arrepentimiento: [contacto + cancelación](https://sparksinsumos.com/contacto/?order_cancellation_without_id=true)

Si el SKU es inspiración o réplica 1:1, la ficha lo dice. No atribuir la
venta a la casa de diseñador.

Cookies: la tienda viva muestra banner de consentimiento.

## Go-to-market

- Sitio vivo: `sparksinsumos.com`, hasta que `web/` lo reemplace.
- Redes: Instagram, Facebook y TikTok `@sparks.insumos`.
- WhatsApp de consultas: el número de Ajustes. Hoy `5491168692694`.
- Newsletter en la tienda viva.
- Showroom: Franklin, retiro con turno.
- Posicionamiento de la vidriera nueva: Sparks Parfums, editorial, bilingüe
  es-AR / en. El backoffice edita esos textos.

## Risks & assumptions

- **Quiénes Somos dice $50.000.** Rige el mínimo del carrito y de Ajustes:
  **$30.000**.
- **«Desde 2019»** (portada del diseño) contra **«hace 3 años»** en Quiénes
  Somos. No hay un año fundacional único.
- **Acumulación.** Cupón, 5/10% por monto y 5% de socio están los tres en
  el diseño. No dice si se suman. No se acumulan hasta que haya una regla.
- **Tarjeta.** Ajustes la deja habilitada (hasta 3 cuotas). No hay pasarela.
  El storefront no cobra con tarjeta hasta que esos ajustes vivan en la API.
- **CBU de la maqueta.** Placeholder. No publicarlo.
- **Via Cargo** sigue nombrado en la tienda viva. El texto default de
  Ajustes dice «Correo Argentino · transporte a cotizar» y no nombra a
  Via Cargo. El campo es editable.
- **Catálogo del backoffice** es perfumería (perfume, set, body splash).
  Maquillaje, skincare y accesorios siguen en la tienda viva y no tienen
  pantalla en este diseño.
- **Filas de la maqueta** no se siembran como datos.
- **Spec 010** deja entrar a cualquier cuenta de la tienda. El diseño ya
  exige rol. La spec de roles todavía no está escrita.

## Glossary link

Términos en `glossary.md`. Piso, descuentos, pagos, roles, stock y estados
de pedido también en `constitution.md`.
