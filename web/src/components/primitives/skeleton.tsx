/**
 * §03/§05 · loading placeholder.
 *
 * The diagonal pattern is the same one that stands in for a missing packshot,
 * and §03 is explicit that it carries **no shimmer animation**: the whole
 * design avoids movement that does not communicate anything.
 */

/** repeating-linear-gradient 135°, 9px bands (§05). */
const DIAGONAL =
  "bg-[repeating-linear-gradient(135deg,var(--color-placeholder-a)_0_9px,var(--color-placeholder-b)_9px_18px)]";

type BoxProps = {
  /** CSS aspect-ratio, e.g. "3 / 3.7" for a catalogue card (§04). */
  ratio?: string;
};

export function SkeletonImage({ ratio = "3 / 3.7" }: BoxProps) {
  return (
    <div
      aria-hidden="true"
      style={{ aspectRatio: ratio }}
      className={`${DIAGONAL} border-border-hairline w-full border`}
    />
  );
}

type LineProps = {
  /** Fraction of the container the bar covers, to fake ragged text. */
  width?: string;
};

/** A 1em bar standing in for a line of text (§03). */
export function SkeletonLine({ width = "100%" }: LineProps) {
  return <div aria-hidden="true" style={{ width }} className={`${DIAGONAL} h-[1em]`} />;
}

type SkeletonProps = {
  /** Already translated, e.g. "Cargando" — read out while the list loads. */
  label: string;
  lines?: number;
};

/**
 * A whole card placeholder. The status role is on the wrapper rather than the
 * bars so a screen reader hears "Cargando" once instead of tracking decorative
 * boxes.
 */
export function SkeletonCard({ label, lines = 3 }: SkeletonProps) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-[13px]">
      <SkeletonImage />
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonLine key={index} width={index === lines - 1 ? "45%" : "80%"} />
      ))}
    </div>
  );
}
