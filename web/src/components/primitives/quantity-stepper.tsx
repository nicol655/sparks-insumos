"use client";

import { MinusIcon, PlusIcon } from "@/components/icons";

/**
 * §03 · quantity control for the product page, the cart and the drawer.
 *
 * The minimum is 1: §03 is explicit that removing a line is the row's ✕, not
 * a zero on the stepper, so the − button disables instead of deleting.
 */

type Props = {
  value: number;
  /** Upper bound, normally the product's stock. */
  max: number;
  onChange: (quantity: number) => void;
  /** Already translated: "Disminuir cantidad" / "Aumentar cantidad" (§03). */
  decreaseLabel: string;
  increaseLabel: string;
  /** Already translated, names the live region, e.g. "Cantidad". */
  valueLabel: string;
};

const STEP_BUTTON =
  "flex h-11 w-11 items-center justify-center font-mono text-[13px] text-ink lg:h-[38px] lg:w-[38px] " +
  "transition-colors hover:bg-ink/6 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " +
  "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent";

export function QuantityStepper({
  value,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
  valueLabel,
}: Props) {
  return (
    <div className="border-ink/22 inline-flex items-center border">
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className={STEP_BUTTON}
      >
        <MinusIcon />
      </button>

      {/*
        The value is its own live region so a screen reader hears the new
        quantity after pressing a step button (§03), without re-reading the
        whole control.
      */}
      <output
        aria-live="polite"
        aria-label={valueLabel}
        className="min-w-[34px] px-1 text-center font-mono text-[12.5px] text-ink lg:min-w-[26px]"
      >
        {value}
      </output>

      <button
        type="button"
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={STEP_BUTTON}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
