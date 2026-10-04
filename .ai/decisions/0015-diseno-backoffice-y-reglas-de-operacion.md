# ADR 0015: El diseño del backoffice fija la operación, no los datos de relleno

- **Status:** accepted
- **Date:** 2026-09-28
- **Deciders:** producto (actualización del modelo de negocio)

## Context

La tienda viva y el PDF de la vidriera no describen cómo opera el equipo.
El artefacto `NtzZJG94zfZrj3LpMvAtS9` es el diseño del backoffice: secciones,
roles, estados de pedido, catálogo, cupones y ajustes. Trae además filas de
ejemplo (clientes, pedidos `SP-`, códigos de cupón, serie de ventas, un CBU).

010 dejó entrar a cualquier cuenta de la tienda y el panel vacío. El
principio 11 decía que el prototipo de la vidriera no habilitaba tarjeta.
El principio 9 no tenía socio ni cupón.

## Decision

Ese artefacto es la única fuente de diseño del backoffice. Lo que fija como
regla entra al modelo y a la constitución (principios 9, 11, 14–17):

- Tres roles. Una cuenta de la tienda no es un operador.
- Pedido en cinco estados. Stock bajo = 1 a 3. Destacados, máximo 4.
- Socio: 5% permanente. Cupón: lo crea el equipo. No se acumula con el
  5/10% ni con el 5% de socio hasta que haya una regla.
- Medios de pago: los de Ajustes. El diseño deja tarjeta (hasta 3 cuotas),
  transferencia y efectivo. Sin esa configuración en la API, el storefront
  no cobra con tarjeta.

Las filas de ejemplo no se publican ni se siembran. ADR-0013 sigue vigente
en la cuenta: un valor que la API no devuelve no se dibuja.

## Alternatives considered

- **Tratar la maqueta entera como dato vivo.** Publicaría clientes, cupones
  y un CBU que son relleno.
- **Dejar el modelo de la tienda viva y usar el artefacto sólo como UI.**
  Roles, socio y tarjeta quedarían otra vez sin escribir, y la próxima spec
  los volvería a inventar o a omitir.
- **Habilitar la tarjeta en el storefront ya.** El diseño la deja prendida
  en Ajustes. No hay pasarela ni esos ajustes en la API.

## Consequences

La spec de las secciones del backoffice tiene que respetar la matriz de
roles. 010 no la cumple: es deuda, no permiso para seguir sin rol. T083
sigue bloqueada por códigos vivos y por la acumulación, no por falta de
mecanismo. Via Cargo no se borra: el texto default de transportes es
editable.
