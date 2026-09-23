"use client";

import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

/**
 * §03 · boxed variant, reserved for the coupon field and the contact textarea
 * — the two places where the field sits next to a button and needs its own
 * edges to stay legible.
 */

/** Message tone under the field. §03: on an invalid coupon the border stays put. */
export type FieldStatus = "none" | "success" | "error";

const BOX =
  "border bg-transparent font-sans text-ink transition-colors " +
  "focus:border-ink focus:outline-none " +
  "disabled:border-ink/12 disabled:bg-ink/4 disabled:text-text-meta";

const BORDER_IDLE = "border-ink/22 hover:border-ink/40";

function statusClass(status: FieldStatus): string {
  if (status === "success") return "text-success";
  if (status === "error") return "text-danger";

  return "text-text-meta";
}

type BoxedInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id"> & {
  label: string;
  /** Already translated, e.g. "Cupón aplicado · −10%" or "Cupón inválido". */
  message?: string;
  status?: FieldStatus;
};

/** Uppercase 12px with wide tracking: the coupon code pattern of §03. */
export function BoxedInput({
  label,
  message,
  status = "none",
  disabled,
  ...props
}: BoxedInputProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-text-meta">
        {label}
      </label>

      <input
        {...props}
        id={id}
        disabled={disabled}
        aria-invalid={status === "error" ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={`${BOX} ${BORDER_IDLE} px-[12px] py-[11px] text-[12px] tracking-[0.08em] uppercase`}
      />

      {message ? (
        <p
          id={messageId}
          // Coupon feedback is not an error the user must fix before moving on,
          // so it is announced politely rather than as an alert.
          role="status"
          className={`font-mono text-[10.5px] tracking-[0.08em] ${statusClass(status)}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "id"> & {
  label: string;
  error?: string;
};

export function BoxedTextArea({ label, error, disabled, rows = 4, ...props }: TextAreaProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-text-meta">
        {label}
      </label>

      <textarea
        {...props}
        id={id}
        rows={rows}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? messageId : undefined}
        className={[
          BOX,
          error ? "border-danger" : BORDER_IDLE,
          // 16px on mobile keeps iOS from zooming the page on focus.
          "text-input-mobile sm:text-input resize-y p-[13px]",
        ].join(" ")}
      />

      {error ? (
        <p id={messageId} className="font-mono text-[10.5px] tracking-[0.08em] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
