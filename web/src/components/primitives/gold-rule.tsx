/**
 * 006 · proto gold dash (34×1). Non-text fill so RNF-2 does not apply.
 * Use it before kickers the prototype paints gold at 10px.
 */
export function GoldRule() {
  return (
    <span aria-hidden="true" data-gold-rule className="bg-accent-gold h-px w-[34px] shrink-0" />
  );
}
