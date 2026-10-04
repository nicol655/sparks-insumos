/** Texto de la maqueta del backoffice (2026-09-28). No es un dato de la API ni se publica en la tienda. */

export const resumenHeading = {
  kicker: "Lunes 28 de septiembre, 2026",
  title: "Buen día, Martina.",
} as const;

export type KpiTone = "success" | "gold" | "meta";

export const kpis: readonly {
  label: string;
  value: string;
  delta: string;
  tone: KpiTone;
}[] = [
  {
    label: "Ventas · 14 días",
    value: "$2.758.000",
    delta: "▲ 24,9% vs. período anterior",
    tone: "success",
  },
  { label: "Pedidos", value: "76", delta: "2 esperando pago", tone: "gold" },
  {
    label: "Ticket promedio",
    value: "$36.289",
    delta: "▲ 3,9% vs. período anterior",
    tone: "success",
  },
  { label: "Socios del club", value: "7", delta: "2 altas esta semana", tone: "meta" },
];

export const sales = {
  label: "Ventas · últimos 14 días",
  total: "$2.758.000",
  ranges: ["7D", "14D", "30D"] as const,
  activeRange: "14D",
  axis: ["15/9", "19/9", "24/9", "28/9"] as const,
};

export const bars: readonly { height: string; title: string; current?: boolean }[] = [
  { height: "55%", title: "15/9 · $144.000" },
  { height: "62%", title: "16/9 · $162.000" },
  { height: "73%", title: "17/9 · $190.000" },
  { height: "84%", title: "18/9 · $221.000" },
  { height: "98%", title: "19/9 · $256.000" },
  { height: "64%", title: "20/9 · $168.000" },
  { height: "57%", title: "21/9 · $149.000" },
  { height: "70%", title: "22/9 · $183.000" },
  { height: "78%", title: "23/9 · $205.000" },
  { height: "88%", title: "24/9 · $231.000" },
  { height: "100%", title: "25/9 · $262.000" },
  { height: "75%", title: "26/9 · $197.000" },
  { height: "67%", title: "27/9 · $176.000" },
  { height: "82%", title: "28/9 · $214.000", current: true },
];

export const recentOrders: readonly {
  id: string;
  customer: string;
  status: string;
  total: string;
}[] = [
  { id: "SP-10482", customer: "Camila Ferrari", status: "Pago pendiente", total: "$75.000" },
  { id: "SP-10481", customer: "Sofía Acosta", status: "Preparando", total: "$39.000" },
  { id: "SP-10480", customer: "Martín Gómez", status: "Preparando", total: "$79.990" },
  { id: "SP-10479", customer: "Lucía Méndez", status: "Pago pendiente", total: "$44.000" },
  { id: "SP-10478", customer: "Nicolás Romero", status: "Enviado", total: "$36.500" },
  { id: "SP-10477", customer: "Valentina Ruiz", status: "Enviado", total: "$40.100" },
];

export const lowStockHeading = "5 REFERENCIAS";

export const lowStock: readonly { name: string; brand: string; stock: string }[] = [
  { name: "Set Lattafa Pride 5 × 20 ml", brand: "Lattafa", stock: "AGOTADO" },
  { name: "Kayali Ylang Coco", brand: "Kayali", stock: "AGOTADO" },
  { name: "Set Odyssey 4 × 30 ml", brand: "Armaf", stock: "1 u." },
  { name: "Pistachio Gelato", brand: "V.V Love", stock: "2 u." },
  { name: "Bharara King", brand: "Bharara", stock: "3 u." },
];

export const messages: readonly { from: string; date: string; subject: string }[] = [
  { from: "Lucía Méndez", date: "Hoy · 10:42", subject: "¿Vuelve el Set Lattafa Pride?" },
  { from: "Diego Paz", date: "Hoy · 08:15", subject: "Compra mayorista para revendedor" },
  { from: "Sofía Acosta", date: "Ayer · 19:03", subject: "Transferencia del pedido SP-10481" },
];
