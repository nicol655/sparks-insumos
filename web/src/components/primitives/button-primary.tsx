import { BUTTON_TYPE, ButtonLabel, TOUCH_TARGET, type BaseButtonProps } from "./button-base";

type Props = BaseButtonProps & {
  /** 15px 28px instead of 17px 30px, for dense contexts (§03). */
  compact?: boolean;
};

/**
 * §03 · primary button. The main action of every screen: ver catálogo,
 * agregar al carrito, finalizar compra.
 *
 * Ink background, canvas text, gold on hover, no radius and no shadow.
 */
export function ButtonPrimary({
  children,
  compact = false,
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
        compact ? "px-[28px] py-[15px]" : "px-[30px] py-[17px]",
        "bg-ink text-canvas",
        "hover:bg-accent-gold",
        "active:translate-y-px active:bg-accent-gold-pressed",
        "focus-visible:outline-ink",
        "disabled:bg-ink/35 disabled:text-canvas/70 disabled:hover:bg-ink/35 disabled:active:translate-y-0",
      ].join(" ")}
    >
      <ButtonLabel loading={loading} loadingLabel={loadingLabel}>
        {children}
      </ButtonLabel>
    </button>
  );
}
