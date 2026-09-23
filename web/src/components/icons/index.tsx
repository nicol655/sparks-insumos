import type { ReactNode } from "react";

/**
 * §05 · "El diseño es casi anicónico por decisión: la navegación se resuelve
 * con texto y líneas."
 *
 * Inline stroke SVG only — never an icon font, never a PNG, never a solid
 * fill. The document's requirements, applied to every icon here: viewBox
 * 0 0 24 24, no fixed width/height, stroke currentColor, fill none, round line
 * caps. Size comes from the className so the call site controls it.
 *
 * Every icon is decorative and carries aria-hidden; a control whose only
 * content is an icon takes its name from aria-label instead.
 *
 * Geometry follows Lucide (stroke 1.5, ISC licence), as §05 recommends.
 */

type IconProps = {
  /** Tailwind sizing, e.g. "h-5 w-5". §05 fixes the size per icon. */
  className?: string;
};

function Icon({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

/** §05 · 18px, 13px glyph on mobile. Search trigger. */
export function SearchIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

/** §05 · 18px. Header cart button, next to the mono counter. */
export function ShoppingBagIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </Icon>
  );
}

/** §05 · 18px. Account; on desktop it may be replaced by text. */
export function UserIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}

/** §05 · 20px. Closes drawers, overlays and menus; removes a cart line. */
export function XIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}

/** §05 · 14px. Sort select. */
export function ChevronDownIcon({ className = "h-[14px] w-[14px]" }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

/** §05 · 16px. Quantity stepper. */
export function PlusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </Icon>
  );
}

/** §05 · 16px. Quantity stepper. */
export function MinusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5 12h14" />
    </Icon>
  );
}

/**
 * §05 · "whatsapp · Único ícono de marca permitido. Usar el logotipo oficial
 * monocromo, **nunca redibujado**; el punto success de 8px puede sustituirlo."
 *
 * We do not have the official asset, and redrawing it is explicitly
 * forbidden — so the document's own substitute is what ships: an 8px success
 * dot. Swap this for the official SVG when brand delivers it.
 */
export function WhatsappDot({ className = "h-2 w-2" }: IconProps) {
  return <span aria-hidden="true" className={`bg-success inline-block rounded-full ${className}`} />;
}

/**
 * §03 · "hamburguesa móvil; el prototipo la dibuja con tres reglas de 1px, que
 * es la solución preferida." Not an SVG for that reason.
 */
export function MenuGlyph({ className = "w-[34px]" }: IconProps) {
  return (
    <span aria-hidden="true" className={`flex flex-col gap-[7px] ${className}`}>
      <span className="bg-ink h-px w-full" />
      <span className="bg-ink h-px w-full" />
      <span className="bg-ink h-px w-full" />
    </span>
  );
}
