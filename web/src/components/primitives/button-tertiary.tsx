import { BUTTON_TYPE, ButtonLabel, type BaseButtonProps } from "./button-base";

/**
 * §03 · tertiary button, the add-to-cart inside a product card. Compact, and
 * it inverts completely on hover to read as the quick action.
 *
 * Compact padding from §03, but AC-15 still needs 44px at 360px, so the
 * minimum height is the shared 44px target. The card image remains the
 * primary tap target; this is the shortcut beside the price.
 */
export function ButtonTertiary({
  children,
  loading = false,
  loadingLabel,
  disabled,
  type = "button",
  ...props
}: BaseButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={[
        BUTTON_TYPE,
        "relative inline-flex min-h-11 items-center justify-center tracking-[0.14em]",
        "border border-border-strong px-[13px] py-[8px] text-ink",
        "hover:border-ink hover:bg-ink hover:text-canvas",
        "active:bg-ink-raised active:text-canvas",
        "focus-visible:outline-ink",
        // Sold out: §03 asks for 40% opacity on border and text, not a fill.
        "disabled:border-ink/40 disabled:text-ink/40 disabled:hover:bg-transparent disabled:hover:text-ink/40",
      ].join(" ")}
    >
      <ButtonLabel loading={loading} loadingLabel={loadingLabel}>
        {children}
      </ButtonLabel>
    </button>
  );
}
