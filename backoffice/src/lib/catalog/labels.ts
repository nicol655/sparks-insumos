export const visibilityLabel = {
  visible: "Publicado",
  hidden: "Borrador",
  not_listed: "No listado",
} as const;

export const typeLabel = {
  digital: "Digital",
  physical: "Físico",
} as const;

export const PHOTO_MESSAGE =
  "El producto necesita entre 1 y 8 fotos JPEG, PNG o WebP de hasta 5 MB.";

export const INVALID_DETAIL = "Faltan datos o no son válidos.";

export const UNAVAILABLE_DETAIL = "No pudimos hablar con el catálogo. Intentá de nuevo.";

export const SESSION_DETAIL = "Tenés que iniciar sesión.";

export const FIFTY_NOTE = "Se ven los 50 más nuevos.";

export const EMPTY_CATALOG = "Todavía no hay productos.";

export const FILTER_EMPTY = "Ningún producto coincide con el filtro.";

export const IMAGE_SLOTS = ["Packshot frontal", "Atomizador", "Notas", "Lifestyle"] as const;

export const FILE_NAME_BUDGET = 17;

export function shortenFileName(name: string, max = FILE_NAME_BUDGET): string {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const extension = dot > 0 ? name.slice(dot) : "";
  const base = extension ? name.slice(0, dot) : name;
  if (!extension) return `${base.slice(0, Math.max(1, max - 3))}...`;
  const room = max - extension.length - 4;
  return `${base.slice(0, Math.max(1, room))}... ${extension}`;
}

export const EN_MISSING = "Sin traducción: el sitio en inglés mostrará el texto en español.";

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
}

export function photoCount(count: number): string {
  return count === 1 ? "1 foto" : `${count} fotos`;
}
