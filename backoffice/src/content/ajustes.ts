/** Texto de la maqueta del backoffice (2026-09-28). No es un dato de la API ni se publica en la tienda. El CBU es de relleno. */

export const ajustesHeading = {
  kicker: "Tienda, envíos, pagos e idiomas",
  title: "Ajustes",
  save: "Guardar ajustes",
} as const;

export type AjustesControl = "text" | "toggle" | "select";

export type AjustesField = {
  label: string;
  value: string;
  control: AjustesControl;
  hint?: string;
};

export type AjustesGroup = {
  title: string;
  sub: string;
  fields: readonly AjustesField[];
};

export const ajustesGroups: readonly AjustesGroup[] = [
  {
    title: "Tienda",
    sub: "Datos visibles en el footer, contacto y emails.",
    fields: [
      { label: "Nombre comercial", value: "Sparks Parfums", control: "text" },
      { label: "Email de contacto", value: "hola@sparksparfums.com", control: "text" },
      {
        label: "WhatsApp de consultas",
        value: "+54 9 11 6869 2694",
        control: "text",
        hint: "Todos los botones de WhatsApp del sitio usan este número.",
      },
      { label: "Retiro / showroom", value: "Franklin, CABA · retiro con turno", control: "text" },
    ],
  },
  {
    title: "Envíos",
    sub: "Reglas de compra y despacho.",
    fields: [
      { label: "Compra mínima (ARS)", value: "30000", control: "text" },
      { label: "Plazo de despacho", value: "24/48 h hábiles", control: "text" },
      { label: "Transportes", value: "Correo Argentino · Transporte a cotizar", control: "text" },
    ],
  },
  {
    title: "Descuentos automáticos",
    sub: "Se aplican en el carrito según el subtotal y el tipo de cuenta.",
    fields: [
      { label: "Nivel 1 · desde (ARS)", value: "100000", control: "text" },
      { label: "Nivel 1 · % off", value: "5", control: "text" },
      { label: "Nivel 2 · desde (ARS)", value: "300000", control: "text" },
      { label: "Nivel 2 · % off", value: "10", control: "text" },
      { label: "Socio del club · % off permanente", value: "5", control: "text" },
    ],
  },
  {
    title: "Medios de pago",
    sub: "Opciones disponibles en el checkout.",
    fields: [
      { label: "Tarjeta de crédito / débito", value: "Habilitada", control: "toggle" },
      { label: "Cuotas sin interés", value: "Hasta 3", control: "select" },
      { label: "Transferencia bancaria", value: "Habilitada", control: "toggle" },
      { label: "CBU / alias", value: "0000003100012345678901", control: "text" },
      { label: "Efectivo al retirar", value: "Habilitado", control: "toggle" },
    ],
  },
  {
    title: "Idiomas y moneda",
    sub: "Internacionalización del sitio público.",
    fields: [
      { label: "Español", value: "Publicado", control: "toggle" },
      { label: "English", value: "Publicado", control: "toggle" },
      { label: "Idioma por defecto", value: "Español", control: "select" },
      { label: "Moneda", value: "Peso argentino (ARS)", control: "select" },
    ],
  },
];
