"use client";

import { useEffect, type RefObject } from "react";

/**
 * §06 · "Foco atrapado dentro del panel mientras esté abierto; Escape cierra y
 * devuelve el foco al botón" — stated for the cart drawer in §03 and required
 * of the mobile menu and the search overlay too. One implementation, shared by
 * the three, so the behaviour cannot drift between them.
 */

/**
 * Everything the browser would put in the tab order. Explicit rather than
 * relying on `:focus-visible` heuristics, because the trap has to know the
 * first and last stops to wrap around.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

type Options = {
  active: boolean;
  /** Escape, per §03. The caller closes the panel; the hook restores focus. */
  onEscape?: () => void;
};

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { active, onEscape }: Options,
): void {
  useEffect(() => {
    const node = containerRef.current;
    if (!active || !node) return;
    const root: HTMLElement = node;

    // Captured before the panel steals focus so it can be handed back on close,
    // wherever the shopper came from.
    const trigger = document.activeElement;

    const stops = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];

    stops()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape?.();
        return;
      }

      if (event.key !== "Tab") return;

      const items = stops();

      if (items.length === 0) return;

      const first = items[0]!;
      const last = items[items.length - 1]!;
      const current = document.activeElement;
      const outside = !root.contains(current);

      // Wrapping at both ends is what keeps the tab order inside the panel;
      // `outside` covers focus having escaped some other way.
      if (event.shiftKey && (current === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, [active, containerRef, onEscape]);
}

/**
 * Stops the page behind a full-screen panel from scrolling. Restores whatever
 * `overflow` was there rather than assuming it was empty, so nesting two
 * overlays cannot leave the page permanently locked.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
