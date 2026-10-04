export type NavItem = {
  label: string;
  href: string;
  count?: string;
};

export type NavGroup = {
  title: string;
  items: readonly NavItem[];
};

export const navGroups: readonly NavGroup[] = [
  {
    title: "Operación",
    items: [
      { label: "Resumen", href: "/dashboard" },
      { label: "Pedidos", href: "/pedidos", count: "2" },
      { label: "Catálogo", href: "/catalogo" },
      { label: "Mensajes", href: "/mensajes", count: "3" },
    ],
  },
  {
    title: "Clientes",
    items: [
      { label: "Usuarios", href: "/usuarios" },
      { label: "Cupones", href: "/cupones", count: "3" },
    ],
  },
  {
    title: "Sitio",
    items: [
      { label: "Contenido", href: "/contenido" },
      { label: "Ajustes", href: "/ajustes" },
    ],
  },
];

export const operator = {
  initials: "MA",
  name: "Martina Álvarez",
  role: "Administradora",
} as const;

export const brand = { name: "Sparks", kicker: "Backoffice" } as const;

export const searchPlaceholder = "Buscar pedidos, productos o clientes";
export const searchPlaceholderNarrow = "Buscar…";

export const storeLinkLabel = "Ver tienda";
export const storeLinkLabelNarrow = "Tienda";

const crumbs: Record<string, string> = {
  "/dashboard": "Resumen",
  "/pedidos": "Pedidos",
  "/catalogo": "Catálogo",
  "/catalogo/nuevo": "Catálogo",
  "/mensajes": "Mensajes",
  "/usuarios": "Usuarios",
  "/cupones": "Cupones",
  "/contenido": "Contenido",
  "/ajustes": "Ajustes",
};

export function crumbFor(pathname: string): string {
  const title = crumbs[pathname];
  return title ? `Backoffice / ${title}` : "Backoffice";
}
