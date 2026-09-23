/**
 * §05 · diagonal placeholder used for missing packshots and for skeleton
 * images. Same 135° / 9px bands, no shimmer.
 */
export const PACKSHOT_PLACEHOLDER =
  "bg-[repeating-linear-gradient(135deg,var(--color-placeholder-a)_0_9px,var(--color-placeholder-b)_9px_18px)]";

const SRCSET_WIDTHS = [400, 800, 1200, 1600] as const;

/** Same file at each width until the image CDN exists (T071). */
export function packshotSrcSet(src: string): string {
  return SRCSET_WIDTHS.map((width) => `${src} ${width}w`).join(", ");
}

export function packshotSize(ratio: string, width: number): { width: number; height: number } {
  const parts = ratio.split("/").map((part) => Number(part.trim()));
  const rw = parts[0];
  const rh = parts[1];
  if (
    rw === undefined ||
    rh === undefined ||
    !Number.isFinite(rw) ||
    !Number.isFinite(rh) ||
    rw === 0
  ) {
    return { width, height: width };
  }

  return { width, height: Math.round((width * rh) / rw) };
}

type Props = {
  alt: string;
  src: string | null;
  /** CSS aspect-ratio. Cards are 3/3.7; the product hero is 4/5. */
  ratio?: string;
  priority?: boolean;
  sizes?: string;
  intrinsicWidth?: number;
  className?: string;
  /** Stretch to a positioned ancestor instead of locking `ratio`. */
  fill?: boolean;
};

/**
 * Product photography or the specified placeholder. The alt is mandatory
 * (AC-20) even when there is no file yet: the placeholder is an image as far
 * as assistive technology is concerned.
 */
export function Packshot({
  alt,
  src,
  ratio = "3 / 3.7",
  priority = false,
  sizes,
  intrinsicWidth = 800,
  className,
  fill = false,
}: Props) {
  const { width, height } = packshotSize(ratio, intrinsicWidth);
  const frame = [
    PACKSHOT_PLACEHOLDER,
    fill ? "absolute inset-0 h-full w-full" : "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={fill ? undefined : { aspectRatio: ratio }}
        className={frame}
      />
    );
  }

  return (
    // Packshots will be remote once photography exists; next/image needs an
    // allowlist we do not have yet. The placeholder branch is the one that ships.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={packshotSrcSet(src)}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      className={[fill ? "absolute inset-0 h-full w-full object-cover" : "w-full object-cover", className]
        .filter(Boolean)
        .join(" ")}
      style={fill ? undefined : { aspectRatio: ratio }}
    />
  );
}
