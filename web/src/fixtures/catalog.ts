import type { Locale } from "@/i18n/locales";
import type { Product } from "@/lib/api/contract";

/**
 * PLACEHOLDER CATALOGUE.
 *
 * The real product list is open question 1 of the spec: nobody has handed over
 * names, prices, notes or stock yet. Brands and olfactive families are the
 * ones shown in the prototype (marquee and "Por familia olfativa" section), so
 * the shape is right even though the rows are not final.
 *
 * Photography is open question 2, so every packshot is null on purpose: the UI
 * then draws the diagonal placeholder specified in §05.
 *
 * Localized fields live side by side here; the mock repository picks the
 * requested locale, mirroring what the api/ service will do.
 */

type Localized = Record<Locale, string>;
type LocalizedList = Record<Locale, string[]>;

type CatalogEntry = Omit<Product, "description" | "notes" | "concentration" | "images"> & {
  description: Localized;
  concentration: Localized;
  notes: { top: LocalizedList; heart: LocalizedList; base: LocalizedList };
  images: { packshot: string | null; thumbnails: string[]; alt: Localized };
};

export const OLFACTIVE_FAMILIES = ["ambar-especias", "florales", "gourmand", "maderas"] as const;

const entries: CatalogEntry[] = [
  {
    id: "prd-001",
    slug: "bharara-king",
    brand: "Bharara",
    name: "King",
    family: "ambar-especias",
    concentration: { es: "Extrait de Parfum", en: "Extrait de Parfum" },
    size: { ml: 100, label: "100 ml" },
    price: { amount: 39000, currency: "ARS" },
    notes: {
      top: { es: ["Bergamota", "Manzana"], en: ["Bergamot", "Apple"] },
      heart: { es: ["Canela", "Jazmín"], en: ["Cinnamon", "Jasmine"] },
      base: { es: ["Ámbar", "Vainilla", "Almizcle"], en: ["Amber", "Vanilla", "Musk"] },
    },
    description: {
      es: "Una apertura frutal que se asienta en un fondo ambarino denso. Proyección alta y estela larga: pensado para la noche.",
      en: "A fruity opening settling into a dense amber base. High projection and a long trail: made for the evening.",
    },
    stock: 7,
    badge: "Best seller",
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "King 100 ml, frasco de Bharara sobre fondo hueso",
        en: "King 100 ml, Bharara bottle on a bone background",
      },
    },
  },
  {
    id: "prd-002",
    slug: "lattafa-khamrah",
    brand: "Lattafa",
    name: "Khamrah",
    family: "gourmand",
    concentration: { es: "Eau de Parfum", en: "Eau de Parfum" },
    size: { ml: 100, label: "100 ml" },
    price: { amount: 32000, currency: "ARS" },
    notes: {
      top: { es: ["Canela", "Nuez moscada"], en: ["Cinnamon", "Nutmeg"] },
      heart: { es: ["Dátil", "Praliné"], en: ["Date", "Praline"] },
      base: { es: ["Vainilla", "Benjuí", "Tonka"], en: ["Vanilla", "Benzoin", "Tonka"] },
    },
    description: {
      es: "Dulce especiado con dátil y vainilla. De los gourmand más reconocibles de la casa.",
      en: "Spiced sweetness built on date and vanilla. One of the house's most recognisable gourmands.",
    },
    stock: 12,
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "Khamrah 100 ml, frasco de Lattafa sobre fondo hueso",
        en: "Khamrah 100 ml, Lattafa bottle on a bone background",
      },
    },
  },
  {
    id: "prd-003",
    slug: "armaf-club-de-nuit-intense",
    brand: "Armaf",
    name: "Club de Nuit Intense",
    family: "maderas",
    concentration: { es: "Eau de Toilette", en: "Eau de Toilette" },
    size: { ml: 105, label: "105 ml" },
    price: { amount: 28500, currency: "ARS" },
    notes: {
      top: { es: ["Limón", "Piña", "Grosella negra"], en: ["Lemon", "Pineapple", "Blackcurrant"] },
      heart: { es: ["Abedul", "Jazmín"], en: ["Birch", "Jasmine"] },
      base: { es: ["Almizcle", "Vainilla", "Ámbar gris"], en: ["Musk", "Vanilla", "Ambergris"] },
    },
    description: {
      es: "Cítrico y ahumado a la vez. Un clásico de entrada al nicho árabe.",
      en: "Citrus and smoke at once. A classic entry point into Arabian niche.",
    },
    stock: 4,
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "Club de Nuit Intense 105 ml, frasco de Armaf sobre fondo hueso",
        en: "Club de Nuit Intense 105 ml, Armaf bottle on a bone background",
      },
    },
  },
  {
    id: "prd-004",
    slug: "rasasi-hawas",
    brand: "Rasasi",
    name: "Hawas",
    family: "maderas",
    concentration: { es: "Eau de Parfum", en: "Eau de Parfum" },
    size: { ml: 100, label: "100 ml" },
    price: { amount: 41000, currency: "ARS" },
    notes: {
      top: { es: ["Manzana", "Bergamota", "Canela"], en: ["Apple", "Bergamot", "Cinnamon"] },
      heart: { es: ["Ámbar gris", "Cardamomo"], en: ["Ambergris", "Cardamom"] },
      base: { es: ["Cedro", "Almizcle"], en: ["Cedar", "Musk"] },
    },
    description: {
      es: "Acuático amaderado de uso diario. Rinde igual de bien con calor que con frío.",
      en: "An everyday woody aquatic. Performs in the heat as well as in the cold.",
    },
    stock: 9,
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "Hawas 100 ml, frasco de Rasasi sobre fondo hueso",
        en: "Hawas 100 ml, Rasasi bottle on a bone background",
      },
    },
  },
  {
    id: "prd-005",
    slug: "paris-corner-emir-ironwood",
    brand: "Paris Corner",
    name: "Emir Ironwood",
    family: "maderas",
    concentration: { es: "Eau de Parfum", en: "Eau de Parfum" },
    size: { ml: 85, label: "85 ml" },
    price: { amount: 26000, currency: "ARS" },
    notes: {
      top: { es: ["Pimienta rosa"], en: ["Pink pepper"] },
      heart: { es: ["Iris", "Violeta"], en: ["Iris", "Violet"] },
      base: { es: ["Vetiver", "Sándalo"], en: ["Vetiver", "Sandalwood"] },
    },
    description: {
      es: "Seco y mineral, con un iris terroso que lo vuelve serio sin ser pesado.",
      en: "Dry and mineral, with an earthy iris that keeps it serious without weight.",
    },
    stock: 0,
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "Emir Ironwood 85 ml, frasco de Paris Corner sobre fondo hueso",
        en: "Emir Ironwood 85 ml, Paris Corner bottle on a bone background",
      },
    },
  },
  {
    id: "prd-006",
    slug: "afnan-9pm",
    brand: "Afnan",
    name: "9PM",
    family: "gourmand",
    concentration: { es: "Eau de Parfum", en: "Eau de Parfum" },
    size: { ml: 100, label: "100 ml" },
    price: { amount: 24500, currency: "ARS" },
    notes: {
      top: { es: ["Manzana", "Lavanda"], en: ["Apple", "Lavender"] },
      heart: { es: ["Canela", "Haba tonka"], en: ["Cinnamon", "Tonka bean"] },
      base: { es: ["Vainilla", "Ámbar"], en: ["Vanilla", "Amber"] },
    },
    description: {
      es: "Dulce y cálido, de los más fáciles de llevar del catálogo.",
      en: "Sweet and warm, one of the easiest wears in the catalogue.",
    },
    stock: 15,
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "9PM 100 ml, frasco de Afnan sobre fondo hueso",
        en: "9PM 100 ml, Afnan bottle on a bone background",
      },
    },
  },
  {
    id: "prd-007",
    slug: "kayali-vanilla-28",
    brand: "Kayali",
    name: "Vanilla 28",
    family: "gourmand",
    concentration: { es: "Eau de Parfum", en: "Eau de Parfum" },
    size: { ml: 50, label: "50 ml" },
    price: { amount: 58000, currency: "ARS" },
    notes: {
      top: { es: ["Orquídea de vainilla"], en: ["Vanilla orchid"] },
      heart: { es: ["Jazmín", "Flor de azahar"], en: ["Jasmine", "Orange blossom"] },
      base: { es: ["Vainilla bourbon", "Almizcle", "Madera de oud"], en: ["Bourbon vanilla", "Musk", "Oud wood"] },
    },
    description: {
      es: "Vainilla limpia sobre un fondo de oud discreto. Estela cercana y persistente.",
      en: "Clean vanilla over a discreet oud base. A close, persistent trail.",
    },
    stock: 3,
    badge: "Nuevo",
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "Vanilla 28 50 ml, frasco de Kayali sobre fondo hueso",
        en: "Vanilla 28 50 ml, Kayali bottle on a bone background",
      },
    },
  },
  {
    id: "prd-008",
    slug: "lattafa-yara",
    brand: "Lattafa",
    name: "Yara",
    family: "florales",
    concentration: { es: "Eau de Parfum", en: "Eau de Parfum" },
    size: { ml: 100, label: "100 ml" },
    price: { amount: 21000, currency: "ARS" },
    notes: {
      top: { es: ["Orquídea", "Heliotropo"], en: ["Orchid", "Heliotrope"] },
      heart: { es: ["Tuberosa", "Gardenia"], en: ["Tuberose", "Gardenia"] },
      base: { es: ["Vainilla", "Sándalo"], en: ["Vanilla", "Sandalwood"] },
    },
    description: {
      es: "Floral cremoso, muy dulce. El más popular entre quienes empiezan.",
      en: "A creamy, very sweet floral. The most popular first bottle.",
    },
    stock: 18,
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "Yara 100 ml, frasco de Lattafa sobre fondo hueso",
        en: "Yara 100 ml, Lattafa bottle on a bone background",
      },
    },
  },
  {
    id: "prd-009",
    slug: "vv-love-oud-rose",
    brand: "V.V Love",
    name: "Oud Rose",
    family: "florales",
    concentration: { es: "Extrait de Parfum", en: "Extrait de Parfum" },
    size: { ml: 50, label: "50 ml" },
    price: { amount: 47000, currency: "ARS" },
    notes: {
      top: { es: ["Azafrán"], en: ["Saffron"] },
      heart: { es: ["Rosa de Damasco"], en: ["Damask rose"] },
      base: { es: ["Oud", "Pachulí"], en: ["Oud", "Patchouli"] },
    },
    description: {
      es: "Rosa y oud en partes iguales, sin azúcar. La lectura más clásica del género.",
      en: "Rose and oud in equal parts, no sugar. The most classical reading of the genre.",
    },
    stock: 2,
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "Oud Rose 50 ml, frasco de V.V Love sobre fondo hueso",
        en: "Oud Rose 50 ml, V.V Love bottle on a bone background",
      },
    },
  },
  {
    id: "prd-010",
    slug: "bharara-oud",
    brand: "Bharara",
    name: "Oud",
    family: "ambar-especias",
    concentration: { es: "Extrait de Parfum", en: "Extrait de Parfum" },
    size: { ml: 100, label: "100 ml" },
    price: { amount: 44000, currency: "ARS" },
    notes: {
      top: { es: ["Azafrán", "Nuez moscada"], en: ["Saffron", "Nutmeg"] },
      heart: { es: ["Oud", "Rosa"], en: ["Oud", "Rose"] },
      base: { es: ["Ámbar", "Cuero"], en: ["Amber", "Leather"] },
    },
    description: {
      es: "Especiado y animálico. Poco apto para oficina, excelente para la noche.",
      en: "Spiced and animalic. Poor office wear, excellent after dark.",
    },
    stock: 5,
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "Oud 100 ml, frasco de Bharara sobre fondo hueso",
        en: "Oud 100 ml, Bharara bottle on a bone background",
      },
    },
  },
  {
    id: "prd-011",
    slug: "armaf-ventana-rose",
    brand: "Armaf",
    name: "Ventana Rose",
    family: "florales",
    concentration: { es: "Eau de Parfum", en: "Eau de Parfum" },
    size: { ml: 100, label: "100 ml" },
    price: { amount: 23000, currency: "ARS" },
    notes: {
      top: { es: ["Pera", "Bergamota"], en: ["Pear", "Bergamot"] },
      heart: { es: ["Rosa", "Peonía"], en: ["Rose", "Peony"] },
      base: { es: ["Almizcle blanco", "Cedro"], en: ["White musk", "Cedar"] },
    },
    description: {
      es: "Floral fresco de uso diario, con una pera inicial muy nítida.",
      en: "A fresh everyday floral with a crisp pear opening.",
    },
    stock: 11,
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "Ventana Rose 100 ml, frasco de Armaf sobre fondo hueso",
        en: "Ventana Rose 100 ml, Armaf bottle on a bone background",
      },
    },
  },
  {
    id: "prd-012",
    slug: "rasasi-la-yuqawam",
    brand: "Rasasi",
    name: "La Yuqawam",
    family: "ambar-especias",
    concentration: { es: "Eau de Parfum", en: "Eau de Parfum" },
    size: { ml: 75, label: "75 ml" },
    price: { amount: 62000, currency: "ARS" },
    notes: {
      top: { es: ["Canela", "Clavo"], en: ["Cinnamon", "Clove"] },
      heart: { es: ["Cuero", "Tabaco"], en: ["Leather", "Tobacco"] },
      base: { es: ["Ámbar", "Sándalo", "Oud"], en: ["Amber", "Sandalwood", "Oud"] },
    },
    description: {
      es: "Cuero especiado de alta concentración. Dos pulsaciones alcanzan para el día entero.",
      en: "High-concentration spiced leather. Two sprays last the whole day.",
    },
    stock: 1,
    images: {
      packshot: null,
      thumbnails: [],
      alt: {
        es: "La Yuqawam 75 ml, frasco de Rasasi sobre fondo hueso",
        en: "La Yuqawam 75 ml, Rasasi bottle on a bone background",
      },
    },
  },
];

/** Resolves the placeholder catalogue into the wire shape for one locale. */
export function catalogFor(locale: Locale): Product[] {
  return entries.map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    brand: entry.brand,
    name: entry.name,
    family: entry.family,
    concentration: entry.concentration[locale],
    size: entry.size,
    price: entry.price,
    notes: {
      top: entry.notes.top[locale],
      heart: entry.notes.heart[locale],
      base: entry.notes.base[locale],
    },
    description: entry.description[locale],
    stock: entry.stock,
    ...(entry.badge ? { badge: entry.badge } : {}),
    images: {
      packshot: entry.images.packshot,
      thumbnails: entry.images.thumbnails,
      alt: entry.images.alt[locale],
    },
  }));
}
