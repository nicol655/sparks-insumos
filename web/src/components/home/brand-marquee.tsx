/**
 * T051 / 003 / 006 · brand marquee.
 *
 * The track is duplicated so a -50% translation loops without a gap. Movement
 * lives in CSS (`animate-marquee`, 34s linear); `prefers-reduced-motion`
 * stops it via the `[data-marquee]` rule in animations.css (AC-16).
 * Proto type is Cormorant 22px, tracking 0.22em. Proto ink at 55% is
 * 4.11:1 on surface-raised — we use `text-text-muted` so AC-13 holds.
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
      <ul data-marquee className="animate-marquee flex w-max gap-14 px-gutter" aria-hidden="true">
        {track.map((brand, index) => (
          <li
            key={`${brand}-${index}`}
            className="font-display text-text-muted shrink-0 text-[22px] leading-none tracking-[0.22em] uppercase whitespace-nowrap"
          >
            {brand}
          </li>
        ))}
      </ul>
      <p className="sr-only">{brands.join(", ")}</p>
    </div>
  );
}
