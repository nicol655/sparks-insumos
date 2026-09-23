"use client";

import { useEffect } from "react";

/**
 * §03 · ephemeral confirmation, bottom-centred, auto-closing at 2200ms.
 *
 * §03 also warns it "no debe ser el único canal de confirmación de una acción
 * crítica": adding to the cart also updates the header counter and opens the
 * drawer, so the toast is a nicety and not the evidence.
 */

/** §03 · auto-close delay. */
export const TOAST_DURATION_MS = 2200;

type Props = {
  /** Already translated. */
  message: string;
  onDismiss: () => void;
  /** Overridable so tests do not have to wait 2.2 seconds. */
  duration?: number;
};

export function Toast({ message, onDismiss, duration = TOAST_DURATION_MS }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    // Two elements on purpose: the fade-up keyframes animate `transform`, so
    // they would cancel the -translate-x-1/2 that centres the toast. The outer
    // box positions, the inner one moves.
    <div className="fixed bottom-[34px] left-1/2 z-[120] -translate-x-1/2">
      <div
        role="status"
        aria-live="polite"
        className={[
          "animate-toast-in bg-ink px-[24px] py-[14px] text-canvas",
          "font-sans text-[11.5px] tracking-[0.14em] whitespace-nowrap uppercase",
        ].join(" ")}
      >
        {message}
      </div>
    </div>
  );
}
