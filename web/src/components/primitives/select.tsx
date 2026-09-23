"use client";

import { useId, type SelectHTMLAttributes } from "react";

import { ChevronDownIcon } from "@/components/icons";

/**
 * §03 · catalogue ordering. Underline only, label to the left, chevron on the
 * right.
 *
 * A native <select> on purpose: it gives the platform's own option list,
 * keyboard handling and mobile picker for free, which no custom listbox
 * matches. The cost is the chevron cannot rotate when the list opens — the
 * browser does not expose that state. §05 asks for the rotation; a custom
 * listbox would be the only way to get it, and it is not worth the
 * accessibility surface.
 */

export type SelectOption = {
  value: string;
  /** Already translated. */
  label: string;
};

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "id" | "children"> & {
  /** Already translated. */
  label: string;
  options: SelectOption[];
};

export function Select({ label, options, ...props }: Props) {
  const id = useId();

  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="font-sans text-[11px] tracking-[0.14em] uppercase text-ink">
        {label}
      </label>

      <div className="relative flex items-center">
        <select
          {...props}
          id={id}
          className={[
            "min-h-11 appearance-none border-0 border-b border-ink bg-transparent",
            "px-[4px] py-[7px] pr-[20px] font-sans text-[12px] text-ink",
            "hover:bg-ink/4",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          ].join(" ")}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDownIcon className="pointer-events-none absolute right-0 h-[14px] w-[14px] text-ink" />
      </div>
    </div>
  );
}
