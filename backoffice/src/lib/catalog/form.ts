import { PHOTO_MESSAGE } from "@/lib/catalog/labels";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const TYPES = new Set(["digital", "physical"]);
const VISIBILITIES = new Set(["visible", "hidden", "not_listed"]);
const FAMILIES = new Set(["ambar-especias", "florales", "gourmand", "maderas"]);

export type ProductWrite = {
  name: string;
  description: string;
  cost: string;
  price: string;
  type: "digital" | "physical";
  visibility: "visible" | "hidden" | "not_listed";
  categoryId: string;
  photos: File[];
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  sku?: string;
  barCode?: string;
  brand?: string;
  discount?: string;
  family: string;
  sizeMl: string;
  tagIds: string[];
};

export type Draft = {
  name: string;
  description: string;
  cost: string;
  price: string;
  type: string;
  visibility: string;
  categoryId: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  sku: string;
  barCode: string;
  brand: string;
  discount: string;
  family: string;
  sizeMl: string;
  tagIds: readonly string[];
  photos: readonly File[];
  keptPhotoCount?: number;
};

export type DraftResult = { ok: true; value: ProductWrite } | { ok: false; message: string };

function isDecimal(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value);
}

function optionalDecimal(value: string): "omit" | "ok" | "bad" {
  const trimmed = value.trim();
  if (!trimmed) return "omit";
  return isDecimal(trimmed) ? "ok" : "bad";
}

function optionalInteger(value: string): "omit" | "ok" | "bad" {
  const trimmed = value.trim();
  if (!trimmed) return "omit";
  return /^-?\d+$/.test(trimmed) ? "ok" : "bad";
}

function photosRejected(files: readonly File[]): boolean {
  if (files.length > 8) return true;
  return files.some((file) => !PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES);
}

export function validateDraft(draft: Draft): DraftResult {
  const missing: string[] = [];
  const invalid: string[] = [];

  const name = draft.name.trim();
  const description = draft.description.trim();
  const cost = draft.cost.trim();
  const price = draft.price.trim();
  const type = draft.type.trim();
  const visibility = draft.visibility.trim();
  const categoryId = draft.categoryId.trim();

  if (!name) missing.push("Nombre");
  if (!description) missing.push("Descripción");
  if (!cost) missing.push("Costo");
  else if (!isDecimal(cost)) invalid.push("Costo");
  if (!price) missing.push("Precio");
  else if (!isDecimal(price)) invalid.push("Precio");
  if (!type) missing.push("Tipo");
  else if (!TYPES.has(type)) invalid.push("Tipo");
  if (!visibility) missing.push("Visibilidad");
  else if (!VISIBILITIES.has(visibility)) invalid.push("Visibilidad");
  if (!categoryId) missing.push("Categoría");
  const family = draft.family.trim();
  const sizeMl = draft.sizeMl.trim();
  if (!family) missing.push("Familia");
  else if (!FAMILIES.has(family)) invalid.push("Familia");
  if (!sizeMl) missing.push("Tamaño");
  else if (!/^[1-9]\d*$/.test(sizeMl)) invalid.push("Tamaño");
  const kept = draft.keptPhotoCount ?? 0;
  const total = draft.photos.length + kept;
  if (total === 0) missing.push("Fotos");
  else if (total > 8 || photosRejected(draft.photos)) invalid.push("Fotos");

  const value: ProductWrite = {
    name,
    description,
    cost,
    price,
    type: type as ProductWrite["type"],
    visibility: visibility as ProductWrite["visibility"],
    categoryId,
    photos: [...draft.photos],
    family,
    sizeMl,
    tagIds: [...draft.tagIds],
  };

  const measures = [
    ["weight", "Peso", draft.weight],
    ["length", "Largo", draft.length],
    ["width", "Ancho", draft.width],
    ["height", "Alto", draft.height],
  ] as const;

  for (const [key, label, raw] of measures) {
    const state = optionalDecimal(raw);
    if (state === "bad") invalid.push(label);
    if (state === "ok") value[key] = raw.trim();
  }

  const sku = draft.sku.trim();
  const barCode = draft.barCode.trim();
  const brand = draft.brand.trim();
  if (sku) value.sku = sku;
  if (barCode) value.barCode = barCode;
  if (brand) value.brand = brand;

  const discount = optionalInteger(draft.discount);
  if (discount === "bad") invalid.push("Descuento");
  if (discount === "ok") value.discount = draft.discount.trim();

  const parts: string[] = [];
  if (invalid.includes("Fotos")) parts.push(PHOTO_MESSAGE);
  if (missing.length > 0) parts.push(`Completá los campos obligatorios: ${missing.join(", ")}.`);
  const rest = invalid.filter((label) => label !== "Fotos");
  if (rest.length > 0) parts.push(`Revisá: ${rest.join(", ")}.`);
  if (parts.length > 0) return { ok: false, message: parts.join(" ") };

  return { ok: true, value };
}
