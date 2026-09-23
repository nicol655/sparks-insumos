import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Shared skeleton of the three §03 buttons. Not a component on its own: the
 * variants differ enough in colour and padding that a single configurable
 * button would be harder to read than three named ones.
 */

export type BaseButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  children: ReactNode;
  /**
   * Swaps the label while an action is in flight. Already translated — the
   * component never invents copy (AC-8).
   */
  loadingLabel?: string;
  loading?: boolean;
};

/** Jost 400, uppercase, no radius, no shadow. */
export const BUTTON_TYPE =
  "font-sans text-label font-normal uppercase transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:cursor-not-allowed";

/**
 * §06 · touch targets are 44px minimum and 48px for primary mobile actions.
 * The reduction happens at the design's own mobile threshold (900px).
 */
export const TOUCH_TARGET = "min-h-12 lg:min-h-11";

type LabelProps = {
  children: ReactNode;
  loading: boolean;
  loadingLabel?: string;
};

/**
 * §03 asks for the label to be swapped "ancho conservado". The idle label
 * stays in flow but invisible so the box keeps its width, and the loading copy
 * is laid over it. A longer loading label overflows rather than resizing the
 * button — that is the trade-off the specification chose.
 */
export function ButtonLabel({ children, loading, loadingLabel }: LabelProps) {
  if (!loading) return <>{children}</>;

  return (
    <>
      <span className="invisible" aria-hidden="true">
        {children}
      </span>
      <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap">
        {loadingLabel}
      </span>
    </>
  );
}
