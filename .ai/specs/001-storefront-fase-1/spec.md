# 001 · Storefront Sparks Parfums — Fase 1

- **Estado:** aprobada (2026-09-22)
- **Fecha:** 2026-09-22
- **Fuentes de verdad del diseño:**
  - `Tienda perfumes diseño web.pdf` (v1.0 · 2026) — Technical Design Specification, 13 páginas.
    Define tokens, tipografía, componentes con estados, grillas, breakpoints, assets, movimiento,
    accesibilidad e i18n. **Cualquier desvío vuelve a este documento antes de codificarse.**
  - Prototipo navegable: `https://claude.ai/artifact/QUUhcHp24QBtXkUG8sHPDj`
    (el PDF lo referencia como `Sparks Perfumes.dc.html`).
  - Ambas fuentes fueron verificadas y son accesibles. Nada en esta spec está inventado:
    lo que no está en el PDF ni en el prototipo aparece bajo «Preguntas abiertas».

## Problema

Sparks Parfums (perfumería de alta concentración, Buenos Aires) vende hoy por WhatsApp.
No hay catálogo navegable ni forma de que un cliente explore por familia olfativa, compare
precios o arme un pedido antes de escribir. Existe un diseño cerrado y documentado, pero
ninguna implementación.

## Objetivo

Publicar la Fase 1 del storefront con fidelidad al diseño documentado: el cliente puede
explorar el catálogo, filtrarlo, ver la ficha de un producto, armar un carrito y continuar
la compra por WhatsApp, en español o inglés.

## Alcance

### Dentro de la Fase 1

| Ruta | Contenido |
|------|-----------|
| `/` | Home: barra de anuncio, hero, marquesina de marcas, familias olfativas, destacados, servicios, club |
| `/catalogo` | Catálogo filtrable: barra lateral 268px, chips de filtro, orden, grilla `auto-fill minmax(250px,1fr)` |
| `/catalogo/[slug]` | Ficha: packshot 4:5 + 3 miniaturas, pirámide olfativa, acordeón, relacionados |
| `/carrito` | Carrito completo: filas `2.4fr 1fr 1fr 0.4fr`, cupón, aside de resumen 380px |
| — | Drawer de carrito (panel lateral 420px), overlay de búsqueda global, menú móvil, botón flotante de WhatsApp, toasts |

### Fuera de la Fase 1 (Fase 2)

`/checkout`, `/login`, `/registro`, `/cuenta`, `/contacto`. El diseño de estas rutas ya está
especificado en el PDF y **no debe re-diseñarse**; sólo se difiere su implementación.

### Fuera de alcance del proyecto entero

- Pasarela de pago. El checkout cierra coordinando el pago por WhatsApp (decisión del negocio).
- Backend. Se desarrollará después, en su propio contenedor. Esta fase consume un contrato
  de API definido acá y resuelto con datos mock hasta que el backend exista.
- Autenticación real. Se implementará junto con el backend.

## Historias de usuario

| # | Prioridad | Historia | Ruta |
|---|-----------|----------|------|
| US-1 | P0 | Como visitante quiero entender qué vende la marca y entrar al catálogo desde la home | `/` |
| US-2 | P0 | Como comprador quiero ver todos los productos con marca, nombre, notas y precio | `/catalogo` |
| US-3 | P0 | Como comprador quiero filtrar por familia, marca, tamaño y precio, y combinar filtros | `/catalogo` |
| US-4 | P0 | Como comprador quiero ver la ficha completa de un perfume antes de decidir | `/catalogo/[slug]` |
| US-5 | P0 | Como comprador quiero agregar al carrito y ajustar cantidades sin perder lo que llevo | drawer + `/carrito` |
| US-6 | P0 | Como comprador quiero cambiar entre español e inglés sin perder el carrito ni recargar | global |
| US-7 | P1 | Como comprador quiero buscar un perfume por nombre, marca o nota desde cualquier página | overlay |
| US-8 | P1 | Como comprador indeciso quiero consultar por WhatsApp con el producto ya precargado en el mensaje | global |
| US-9 | P1 | Como comprador en el celular quiero navegar cómodamente a 360px de ancho | global |

## Requisitos funcionales

- **RF-1 · Catálogo.** Listado con tarjeta según §03 del PDF. Estados obligatorios de toda lista:
  carga (skeleton diagonal), vacío (mensaje + CTA de WhatsApp), error (mensaje + reintentar), resultado.
- **RF-2 · Filtros.** Chips toggle con `aria-pressed`. Los filtros activos se muestran sobre la grilla
  y son removibles. Una combinación sin resultados deshabilita el chip (opacidad 0.4). El estado de
  filtros vive en la URL (compartible y recargable).
- **RF-3 · Orden.** Select con línea inferior. Ordenamientos del prototipo.
- **RF-4 · Ficha.** Packshot 4:5 adhesivo a `top: 74px`, 3 miniaturas 1:1, pirámide olfativa,
  acordeón (descripción / envíos / devoluciones) multi-panel, stepper, relacionados.
- **RF-5 · Carrito.** Persiste entre recargas, navegaciones y cambios de idioma. Mínimo 1 unidad por
  línea; la eliminación se hace con la ✕ de la fila. Drawer con foco atrapado; Escape cierra y
  devuelve el foco al botón de carrito.
- **RF-6 · Búsqueda global.** Overlay con backdrop `rgba(20,16,14,0.55)` + blur, foco automático,
  chips de sugerencia, resultados en vivo desde 2 caracteres (máx. 4). Cierra con backdrop, Escape
  o Enter. Enter navega al catálogo con el término aplicado como filtro.
- **RF-7 · i18n.** `es-AR` (por defecto) y `en`. **Ninguna cadena embebida en el markup**: todo
  vive en diccionarios por clave. El cambio de idioma no recarga la página ni pierde el carrito.
- **RF-8 · Moneda.** Pesos argentinos, separador de miles de punto, sin decimales (`$39.000`),
  vía `Intl.NumberFormat` con locale `es-AR`. Prohibido concatenar manualmente.
- **RF-9 · WhatsApp.** Enlaces `wa.me` al `5491168692694` con mensaje precargado según contexto
  (consulta general, stock, producto específico), codificado con `encodeURIComponent`.
- **RF-10 · Datos.** Productos y categorías se leen a través de un contrato de API versionado,
  no de literales dispersos por los componentes.

## Requisitos no funcionales

- **RNF-1 · Fidelidad de diseño.** Los tokens de color, la escala tipográfica, el espaciado y los
  breakpoints son exactamente los del PDF. Radio 0 en todo salvo chips y punto indicador (999px).
  Una sola familia de grosor de línea: 1px.
- **RNF-2 · Accesibilidad (§06 del PDF).** Contraste AA mínimo; `text-meta #6F665A` reemplaza al
  `#8A8073` del prototipo en todo texto <19px. `accent-gold` sólo ≥24px o en elementos no textuales.
  Foco visible siempre (outline 2px, offset 2px). Áreas táctiles ≥44px (48px en acciones primarias
  móviles). Un solo `<h1>` por ruta. Grilla de productos como lista.
- **RNF-3 · Movimiento.** Micro-interacciones 180ms; paneles 250–300ms; drawer 300ms
  `cubic-bezier(0.22,1,0.36,1)`; nada por encima de 400ms. Con `prefers-reduced-motion: reduce`
  la marquesina se detiene y toda animación baja a un fundido de 120ms. Los `hover` van envueltos
  en `@media (hover: hover)`.
- **RNF-4 · Entorno.** Todo corre en Docker. No se requiere Node, npm ni navegadores instalados en
  la máquina del desarrollador.
- **RNF-5 · Regresión.** Suite automatizada que permite validar que una feature futura no rompe lo
  existente, ejecutable en Docker con un solo comando.
- **RNF-6 · Tipado.** TypeScript en modo estricto; las respuestas de API se validan en runtime.
- **RNF-7 · Rendimiento de fuentes.** Las tres familias autoalojadas, `font-display: swap`,
  subset latin + latin-ext, peso total objetivo <180KB.
- **RNF-8 · Elasticidad de copy.** El inglés corre 15–30% más largo: navegación, botones y
  encabezados deben verificarse en ambos idiomas a 360px sin desbordes.

## Criterios de aceptación

Cada criterio es verificable de forma automática salvo indicación contraria.

| ID | Criterio |
|----|----------|
| AC-1 | Cada token de color del §01 existe en el tema con su hex exacto y ninguno adicional se introduce |
| AC-2 | Cada nivel de la escala tipográfica del §02 existe con su `clamp`, `line-height` y `tracking` exactos |
| AC-3 | Los breakpoints declarados son 560 / 700 / 900 / 1140 / 1440 / 2160px y el contenedor raíz se limita a 2160px |
| AC-4 | `formatPrice(39000)` devuelve `$39.000` en `es-AR`; sin decimales, con punto de miles |
| AC-5 | Agregar un producto abre el drawer, incrementa el contador del header y dispara un toast con `role="status"` |
| AC-6 | El carrito sobrevive a recarga, navegación entre rutas y cambio de idioma |
| AC-7 | Cambiar de idioma traduce toda la UI visible y no produce una recarga completa de página |
| AC-8 | No existe ninguna cadena de UI literal en los componentes (verificado por lint) |
| AC-9 | Aplicar filtros actualiza la URL; recargar esa URL reproduce el mismo resultado |
| AC-10 | Una combinación de filtros sin resultados muestra el estado vacío con CTA de WhatsApp |
| AC-11 | El drawer atrapa el foco; Escape lo cierra y devuelve el foco al botón de carrito |
| AC-12 | El overlay de búsqueda enfoca el input al abrir y devuelve el foco al trigger al cerrar |
| AC-13 | Cada ruta de Fase 1 pasa axe sin violaciones críticas ni serias, en ambos idiomas |
| AC-14 | Cada ruta tiene exactamente un `<h1>` |
| AC-15 | Todo control interactivo mide ≥44×44px en el viewport de 360px |
| AC-16 | Con `prefers-reduced-motion: reduce` la marquesina está detenida |
| AC-17 | A 360px de ancho no hay scroll horizontal ni texto desbordado, en `es` y en `en` |
| AC-18 | Los enlaces de WhatsApp apuntan a `wa.me/5491168692694` con el mensaje URL-codificado |
| AC-19 | `docker compose run --rm web npm run verify` pasa en limpio desde un clon sin Node local |
| AC-20 | Toda imagen de producto tiene `alt` descriptivo; ninguna dice «imagen de producto» |

## Preguntas abiertas

Ninguna bloquea el plan. Se resuelven durante `/implement`:

1. **Contenido real del catálogo.** El prototipo trae datos de muestra. Hace falta el listado real
   (nombre, marca, tamaño, precio, notas, stock) para poblar los fixtures.
2. **Fotografía de producto.** El §05 exige 4 tomas por producto en WebP. Mientras no existan, se
   usa el placeholder diagonal especificado (`#EDE7DC`/`#F2EDE4`, 135°) — que el PDF ya contempla.
3. **Barra de anuncio.** El PDF la declara «desactivable por configuración»; falta definir dónde
   vive esa configuración una vez exista el backend.
4. **Reglas del cupón (T083).** No hay definición de qué códigos existen, qué descuento aplican ni
   si se acumulan con los descuentos por monto de la barra de anuncio (5% desde $100.000, 10%
   desde $300.000), que parecen automáticos y no por código. El store de carrito quedó sin cupón
   a la espera de esta definición. **Bloquea T083.**
5. **Ordenamientos del catálogo (RF-3).** El PDF remite al prototipo y no los lista; los clics
   dentro del iframe del artifact de Claude no registran, así que no se pudieron leer.
   `contract.ts` declara un conjunto provisional (`relevance`, `price-asc`, `price-desc`,
   `name-asc`) marcado como tal. **Confirmar antes de T063.**
