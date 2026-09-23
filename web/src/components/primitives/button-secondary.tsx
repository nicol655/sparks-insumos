import { BUTTON_TYPE, ButtonLabel, TOUCH_TARGET, type BaseButtonProps } from "./button-base";

type Props = BaseButtonProps & {
  /** Inverted palette for the dark blocks of §03 (contact, footer). */
  onInk?: boolean;
};

/**
 * §03 · secondary button (outline). Same visual weight as the primary but
 * less pull: consultar por WhatsApp, ver carrito, seguir comprando.
 */
export function ButtonSecondary({
  children,
  onInk = false,
  loading = false,
  loadingLabel,
  disabled,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={[
        BUTTON_TYPE,
        TOUCH_TARGET,
        "relative inline-flex items-center justify-center tracking-[0.2em]",
        "border px-[26px] py-[16px]",
        onInk
          ? "border-canvas/35 text-canvas hover:border-canvas focus-visible:outline-canvas"
          : "border-border-strong text-ink hover:border-ink hover:bg-ink/4 active:bg-ink/8 focus-visible:outline-ink",
        "disabled:border-ink/14 disabled:text-text-meta disabled:hover:bg-transparent",
        onInk && "disabled:border-canvas/20 disabled:text-canvas/50",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ButtonLabel loading={loading} loadingLabel={loadingLabel}>
        {children}
      </ButtonLabel>
    </button>
  );
}
