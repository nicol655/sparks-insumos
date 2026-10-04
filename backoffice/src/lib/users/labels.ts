export const INVALID_DETAIL = "Faltan datos o no son válidos.";

export const UNAVAILABLE_DETAIL = "No pudimos hablar con las cuentas. Intentá de nuevo.";

export const SESSION_DETAIL = "Tenés que iniciar sesión.";

export const FIFTY_NOTE = "Se ven los 50 más nuevos.";

export const EMPTY_CLIENTS = "Todavía no hay clientes.";

export const FILTER_EMPTY = "Ningún cliente coincide con la búsqueda.";

export const EMPTY_TEAM = "Todavía no hay miembros del equipo.";

export const DELETE_UNAVAILABLE = "Todavía no se puede eliminar la cuenta.";

export const CREATED_TOAST = "Cliente creado";

export const UPDATED_TOAST = "Cliente actualizado";

export const DELETE_BODY =
  "Se borrarán sus datos, su historial de pedidos, su nivel de socio y sus cupones. Esta acción no se puede deshacer.";

export const SENSITIVE_BODY =
  "Bloquear impide el inicio de sesión y las compras, sin borrar datos. Eliminar borra la cuenta, el historial y los cupones asociados.";

export const PASSWORD_HINT = "Vacío para mantener la actual.";

export function formatAlta(iso: string): string {
  const parts = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(iso));
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  return `${day}/${month}/${year}`;
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toLocaleUpperCase("es");
}

export function clientsKicker(count: number): string {
  return `${count} clientes · 0 socios del club`;
}

export function clientsSummary(count: number): string {
  return `${count} CLIENTES · — HISTÓRICO`;
}
