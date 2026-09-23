"use client";

import { useId, type InputHTMLAttributes } from "react";

/**
 * §03 · line input. The default form pattern: mono label above, no box, a
 * single 1px underline.
 *
 * The underline replaces the focus outline here — §03 declares that pattern
 * explicitly and reinforces the perceived thickness with a box-shadow, rather
 * than drawing a second ring around a field that has no box.
 */

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id"> & {
  /** Already translated. */
  label: string;
  /** Already translated; presence switches the field into its error state. */
  error?: string;
  /** Already translated helper shown under the field when there is no error. */
  hint?: string;
};

export function TextInput({ label, error, hint, disabled, ...props }: Props) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-[7px]">
      <label
        htmlFor={id}
        className={[
          "font-mono text-[9.5px] tracking-[0.14em] uppercase",
          disabled ? "text-text-meta/45" : "text-text-meta",
        ].join(" ")}
      >
        {label}
      </label>

      <input
        {...props}
        id={id}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={[
          // 16px on mobile is not a design choice: anything smaller makes iOS
          // zoom the whole page on focus (§03).
          "text-input-mobile sm:text-input font-sans text-ink",
          "border-b bg-transparent px-[2px] py-[11px]",
          "placeholder:text-text-meta",
          "focus:outline-none",
          error
            ? "border-danger focus:border-danger focus:shadow-[0_1px_0_var(--color-danger)]"
            : "border-border-strong hover:border-ink/50 focus:border-ink focus:shadow-[0_1px_0_var(--color-ink)]",
          "disabled:cursor-default disabled:border-dashed disabled:opacity-45 disabled:hover:border-border-strong",
        ].join(" ")}
      />

      {message ? (
        <p
          id={messageId}
          className={[
            "font-mono text-[10.5px] tracking-[0.08em]",
            error ? "text-danger" : "text-text-meta",
          ].join(" ")}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
