import type { ReactNode } from "react";

import { XIcon } from "@/components/icons";

/**
 * §03 · the only element in the system with a full radius.
 *
 * Two jobs: a toggle in the catalogue sidebar, and a removable pill above the
 * grid showing an applied filter. §06 asks for the filters to be "un grupo de
 * botones toggle con aria-pressed", which is what the toggle form is.
 */

const CHIP_BASE =
  "inline-flex min-h-11 items-center rounded-chip border px-[12px] py-[7px] " +
  "font-sans text-[11px] tracking-[0.08em] transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

type ToggleProps = {
  children: ReactNode;
  pressed: boolean;
  onToggle: () => void;
  /** No product matches this combination; §03 dims it to 40% and blocks it. */
  disabled?: boolean;
};

export function FilterChip({ children, pressed, onToggle, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onToggle}
      className={[
        CHIP_BASE,
        pressed
          ? "border-ink bg-ink text-canvas hover:bg-ink-raised"
          : "border-ink/20 text-ink hover:border-ink/40 hover:bg-ink/5",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
        pressed && "disabled:hover:bg-ink",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

type RemovableProps = {
  children: ReactNode;
  /** Already translated, e.g. "Quitar filtro: Gourmand" (§03). */
  removeLabel: string;
  onRemove: () => void;
};

export function RemovableFilterChip({ children, removeLabel, onRemove }: RemovableProps) {
  return (
    <button
      type="button"
      aria-label={removeLabel}
      onClick={onRemove}
      className={`${CHIP_BASE} gap-2 border-ink bg-ink text-canvas hover:bg-ink-raised`}
    >
      {children}
      <XIcon className="h-[11px] w-[11px] opacity-60" />
    </button>
  );
}
