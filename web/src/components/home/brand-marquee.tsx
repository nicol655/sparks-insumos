/**
 * T051 / 003 · brand marquee.
 *
 * The track is duplicated so a -50% translation loops without a gap. Movement
 * lives in CSS (`animate-marquee`, 34s linear); `prefers-reduced-motion`
 * stops it via the `[data-marquee]` rule in animations.css (AC-16).
 * Sits flush under the hero image (`bg-surface-raised`, fixed 11px type).
 */

type Props = {
  brands: string[];
};

export function BrandMarquee({ brands }: Props) {
  if (brands.length === 0) return null;

  const track = [...brands, ...brands];

  return (
    <div
      data-home-marquee
      className="border-border-hairline bg-surface-raised overflow-hidden border-y py-5"
    >
      <ul data-marquee className="animate-marquee flex w-max gap-12 px-gutter" aria-hidden="true">
        {track.map((brand, index) => (
          <li
            key={`${brand}-${index}`}
            className="font-sans shrink-0 text-[11px] leading-none tracking-[0.18em] uppercase whitespace-nowrap"
          >
            {brand}
          </li>
        ))}
      </ul>
      <p className="sr-only">{brands.join(", ")}</p>
    </div>
  );
}
