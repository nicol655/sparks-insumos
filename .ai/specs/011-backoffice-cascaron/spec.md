# 011 · Cascarón del backoffice (resumen y ajustes)

- **Estado:** aprobada (pedido de `/plan`, 2026-09-28)
- **Fecha:** 2026-09-28
- **Padre:** [010](../010-backoffice/spec.md) publica el servicio, el login
  y la guarda. Esta spec reemplaza RF-7 y AC-9 de 010: `/dashboard` deja
  de estar en blanco.
- **Fuente visual, única:** [artefacto del backoffice](https://claude.ai/artifact/NtzZJG94zfZrj3LpMvAtS9),
  leído el 2026-09-28. Estado inicial de esa maqueta (rango 14 días,
  sidebar oscuro). Los textos de relleno se pintan tal cual. No son
  datos del negocio (principio 17, ADR-0015).

## Problema

Quien entra ve un panel vacío. El diseño ya tiene el cascarón (menú,
encabezado y área de contenido) y dos pantallas con información:
resumen y ajustes. Sin eso no hay donde colgar el resto de las secciones.

## Objetivo

Con sesión, el backoffice muestra el cascarón del diseño. El menú lista
todas las secciones. El encabezado tiene migas, búsqueda y el enlace a
la tienda. Resumen y ajustes muestran, en texto fijo, toda la información
que el diseño pinta en su estado inicial. El resto de secciones sólo
tiene título. Nada llama a un servicio.

## Alcance

### Dentro

1. Menú lateral izquierdo, con los tres grupos y los ítems del diseño,
   conteos incluidos, y el pie con el operador de la maqueta.
2. Encabezado de tres zonas: migas, campo de búsqueda, enlace a la tienda.
3. Área de contenido común: antetítulo, título y, si el diseño lo tiene
   en esa pantalla, la acción.
4. Resumen (`/dashboard`) y ajustes (`/ajustes`) con el texto del estado
   inicial del diseño.
5. El resto de ítems del menú abre una ruta con el mismo cascarón y sólo
   el título de la sección.
6. Tests de unidad. Sin red.

### Fuera

- Llamadas a `api/` nuevas. `POST /auth/login` sigue como en 010.
- Un repositorio, un fixture que se filtre o un cálculo de ventas. El
  texto está escrito. Cambiar 7D / 14D / 30D no recalcula.
- Resultados de la búsqueda. El campo se ve y se puede escribir; no abre
  una lista.
- Contenido de pedidos, catálogo, mensajes, usuarios, cupones y
  contenido del sitio: tablas, fichas, cajones, exportar, invitar.
- Persistir ajustes. «Guardar ajustes» no llama a la red y no cambia el
  texto pintado.
- Roles. Cualquier sesión de 010 entra y ve el cascarón completo. La
  matriz de permisos sigue para otra spec (principio 14).
- Logout, cambio de clave, registro.
- Atajo ⌘K, toast, densidad, sidebar claro y color de acento configurables.
  El sidebar es el oscuro del diseño.
- `web/`, `api/`, Playwright.
- Publicar el CBU de la maqueta en la tienda. Sólo aparece como valor
  del campo de ajustes.

## Rutas

Sin prefijo de idioma. La guarda de 010 no cambia: sin sesión, todo lo
que no sea `/login` ni `/unauthorized` va a `/unauthorized`. Con sesión,
`/login` y `/` siguen yendo a `/dashboard`.

| Ruta | Sesión | Qué se ve |
|------|--------|-----------|
| `/login`, `/unauthorized` | — | Igual que 010. Sin menú ni encabezado de panel |
| `/dashboard` | Sí | Cascarón + resumen |
| `/ajustes` | Sí | Cascarón + ajustes |
| `/pedidos`, `/catalogo`, `/mensajes`, `/usuarios`, `/cupones`, `/contenido` | Sí | Cascarón + título de la sección. Nada más |

## Historias

| # | Prioridad | Historia |
|---|-----------|----------|
| US-1 | P0 | Como operador con sesión veo el menú y el encabezado del diseño, y puedo pasar de una sección a otra |
| US-2 | P0 | Como operador abro el resumen y leo las cifras, los pedidos, el stock y las consultas que muestra el diseño |
| US-3 | P0 | Como operador abro ajustes y leo cada dato de tienda, envíos, descuentos, pagos e idiomas que muestra el diseño |

## Requisitos

### RF-1 · Menú

Grupos e ítems, en este orden. El conteo es texto, no un cálculo.

| Grupo | Ítem | Conteo | Ruta |
|-------|------|--------|------|
| Operación | Resumen | — | `/dashboard` |
| Operación | Pedidos | 2 | `/pedidos` |
| Operación | Catálogo | — | `/catalogo` |
| Operación | Mensajes | 3 | `/mensajes` |
| Clientes | Usuarios | — | `/usuarios` |
| Clientes | Cupones | 3 | `/cupones` |
| Sitio | Contenido | — | `/contenido` |
| Sitio | Ajustes | — | `/ajustes` |

El conteo de Usuarios salió con [019](../019-usuarios-backoffice/spec.md):
el `10` era relleno de la maqueta. El ítem queda sin número, igual que
Catálogo.

- Marca del menú: «Sparks» y, debajo, «Backoffice».
- El ítem de la ruta actual se distingue del resto.
- Pie: iniciales «MA», nombre «Martina Álvarez», rol «Administradora».
  Es el texto de la maqueta, no el usuario de la sesión. No se llama a
  `GET /me`.
- Por debajo de 900px el menú no ocupa la columna: hay un botón
  «Menú» en el encabezado que lo abre encima del contenido, y cerrarlo
  lo oculta. En el escritorio ese botón no se muestra.

### RF-2 · Encabezado

Tres zonas, en este orden:

1. Migas. En resumen: «Backoffice / Resumen». En el resto: «Backoffice / »
   más el título de la sección («Ajustes», «Pedidos», «Catálogo»,
   «Mensajes», «Usuarios», «Cupones», «Contenido»).
2. Búsqueda. Placeholder en escritorio: «Buscar pedidos, productos o
   clientes». Por debajo de 640px: «Buscar…». No hay lista de resultados
   ni el texto «Sin coincidencias».
3. Enlace a la tienda. Texto «Ver tienda» desde 640px y «Tienda» por
   debajo, en los dos casos seguido de «↗». El href es la tienda del
   stack, no el archivo `Sparks Perfumes.dc.html` de la maqueta. Se abre
   en la misma pestaña.

### RF-3 · Resumen

Antetítulo: «Lunes 28 de septiembre, 2026». Título: «Buen día, Martina.».
Sin botón de acción. La fecha y el nombre son texto fijo, no el reloj ni
la sesión.

Cuatro fichas, en este orden:

| Etiqueta | Valor | Línea de abajo |
|----------|-------|----------------|
| Ventas · 14 días | $2.758.000 | ▲ 24,9% vs. período anterior |
| Pedidos | 76 | 2 esperando pago |
| Ticket promedio | $36.289 | ▲ 3,9% vs. período anterior |
| Socios del club | 7 | 2 altas esta semana |

Bloque de ventas: «Ventas · últimos 14 días», total «$2.758.000», y tres
controles «7D», «14D», «30D» con 14D activo. Catorce barras del 15/9 al
28/9; el eje muestra «15/9», «19/9», «24/9» y «28/9». Pulsar 7D o 30D no
cambia cifras ni barras.

Pedidos recientes, seis filas, enlace «Ver todos» a `/pedidos`:

| Pedido | Cliente | Estado | Total |
|--------|---------|--------|-------|
| SP-10482 | Camila Ferrari | Pago pendiente | $75.000 |
| SP-10481 | Sofía Acosta | Preparando | $39.000 |
| SP-10480 | Martín Gómez | Preparando | $79.990 |
| SP-10479 | Lucía Méndez | Pago pendiente | $44.000 |
| SP-10478 | Nicolás Romero | Enviado | $36.500 |
| SP-10477 | Valentina Ruiz | Enviado | $40.100 |

Una fila no abre ficha.

Stock bajo. Encabezado «5 REFERENCIAS». Filas:

| Nombre | Marca | Stock |
|--------|-------|-------|
| Set Lattafa Pride 5 × 20 ml | Lattafa | AGOTADO |
| Kayali Ylang Coco | Kayali | AGOTADO |
| Set Odyssey 4 × 30 ml | Armaf | 1 u. |
| Pistachio Gelato | V.V Love | 2 u. |
| Bharara King | Bharara | 3 u. |

Consultas sin responder. Enlace «Bandeja» a `/mensajes`. Tres filas:
«Lucía Méndez» / «Hoy · 10:42» / «¿Vuelve el Set Lattafa Pride?»;
«Diego Paz» / «Hoy · 08:15» / «Compra mayorista para revendedor»;
«Sofía Acosta» / «Ayer · 19:03» / «Transferencia del pedido SP-10481».

### RF-4 · Ajustes

Antetítulo: «Tienda, envíos, pagos e idiomas». Título: «Ajustes». Botón
«Guardar ajustes». Pulsarlo no dispara red y los valores de abajo siguen
iguales.

Cada grupo muestra su título, su bajada y estos valores:

| Grupo | Bajada | Campos |
|-------|--------|--------|
| Tienda | Datos visibles en el footer, contacto y emails. | Nombre comercial «Sparks Parfums». Email «hola@sparksparfums.com». WhatsApp «+54 9 11 6869 2694», con la ayuda «Todos los botones de WhatsApp del sitio usan este número.». Retiro «Franklin, CABA · retiro con turno» |
| Envíos | Reglas de compra y despacho. | Compra mínima «30000». Plazo «24/48 h hábiles». Transportes «Correo Argentino · Transporte a cotizar» |
| Descuentos automáticos | Se aplican en el carrito según el subtotal y el tipo de cuenta. | Nivel 1 desde «100000» y «5». Nivel 2 desde «300000» y «10». Socio «5» |
| Medios de pago | Opciones disponibles en el checkout. | Tarjeta «Habilitada». Cuotas «Hasta 3». Transferencia «Habilitada». CBU «0000003100012345678901». Efectivo «Habilitado» |
| Idiomas y moneda | Internacionalización del sitio público. | Español «Publicado». English «Publicado». Idioma por defecto «Español». Moneda «Peso argentino (ARS)» |

Las etiquetas visibles de cada campo son las del diseño: «Nombre
comercial», «Email de contacto», «WhatsApp de consultas», «Retiro /
showroom», «Compra mínima (ARS)», «Plazo de despacho», «Transportes»,
«Nivel 1 · desde (ARS)», «Nivel 1 · % off», «Nivel 2 · desde (ARS)»,
«Nivel 2 · % off», «Socio del club · % off permanente», «Tarjeta de
crédito / débito», «Cuotas sin interés», «Transferencia bancaria»,
«CBU / alias», «Efectivo al retirar», «Español», «English», «Idioma por
defecto», «Moneda».

### RF-5 · Otras secciones

`/pedidos`, `/catalogo`, `/mensajes`, `/usuarios`, `/cupones` y
`/contenido` muestran el cascarón, las migas y un único `h1` con
«Pedidos», «Catálogo», «Mensajes», «Usuarios», «Cupones» o «Contenido».
No hay tabla, filtro, ficha ni botón de crear.

## Requisitos no funcionales

| # | Requisito |
|---|-----------|
| RNF-1 | Paleta, fuentes y radios ya definidos en `backoffice/`. Sin librería de gráficos ni dependencia nueva |
| RNF-2 | Ningún `fetch` nuevo. El texto vive en el repo |
| RNF-3 | Tests de unidad en Docker, sin Node en el host y sin `api/` |
| RNF-4 | El CBU y los nombres de la maqueta no salen de este panel |

## Criterios de aceptación

| # | Criterio |
|---|----------|
| AC-1 | Con el cascarón montado se leen los tres grupos, los ocho ítems, los conteos 2, 3 y 3 de Pedidos, Mensajes y Cupones, «Sparks», «Backoffice», «Martina Álvarez» y «Administradora». Catálogo y Usuarios no llevan conteo. Resumen apunta a `/dashboard` y Ajustes a `/ajustes` |
| AC-2 | El encabezado muestra «Backoffice / Resumen» en el resumen, el placeholder «Buscar pedidos, productos o clientes» y un enlace «Ver tienda» cuyo href es la URL de la tienda configurada. No aparece `Sparks Perfumes.dc.html` ni una lista de resultados |
| AC-3 | `/login` y `/unauthorized` no muestran el menú ni «Martina Álvarez» |
| AC-4 | La guarda, sin sesión, manda `/dashboard`, `/ajustes` y `/pedidos` a `/unauthorized`. Con sesión no los manda |
| AC-5 | El resumen muestra las cuatro fichas con los valores de RF-3, «$2.758.000», «14D», las seis filas de pedidos, las cinco de stock, las tres consultas, «Ver todos» y «Bandeja» |
| AC-6 | El resumen no consulta la red. Los controles 7D y 30D están y no cambian «$2.758.000» |
| AC-7 | Ajustes muestra los cinco grupos y cada valor de RF-4, incluido el CBU de la maqueta y «Hasta 3» |
| AC-8 | Pulsar «Guardar ajustes» no llama a `fetch` y el email «hola@sparksparfums.com» sigue en pantalla |
| AC-9 | `/pedidos` muestra el `h1` «Pedidos» y no muestra «Exportar CSV» ni una fila `SP-` |
| AC-10 | El botón «Menú» existe para el ancho angosto y no se ofrece en el ancho de escritorio |

## Cerrado el 2026-09-28

1. «El contenido de cada sección» del pedido es el hueco del cascarón.
   Sólo resumen y ajustes llevan la información del diseño.
2. «Texto mocked» significa cadenas escritas en el repo. No hay cliente
   HTTP ni repositorio de mentira.
3. El enlace a la tienda apunta al storefront del stack. La maqueta
   apuntaba a un HTML local; esa ruta no se copia.
4. El operador del pie es el de la maqueta hasta que una spec lea la
   sesión.
5. 010, RF-7 y AC-9, quedan reemplazados por esta spec.

## Preguntas abiertas

Ninguna que bloquee el plan.
