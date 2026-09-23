"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * §03 · product page accordion: description, shipping, returns.
 *
 * Several panels can be open at once, so state is a set of ids rather than a
 * single selected one.
 */

export type AccordionItem = {
  id: string;
  /** Already translated. */
  title: string;
  content: ReactNode;
};

type Props = {
  items: AccordionItem[];
  /** Ids open on first render. */
  defaultOpen?: string[];
};

export function Accordion({ items, defaultOpen = [] }: Props) {
  const scope = useId();
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen));

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);

      return next;
    });

  return (
    <div>
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const headerId = `${scope}-${item.id}-header`;
        const panelId = `${scope}-${item.id}-panel`;

        return (
          <div key={item.id} className="border-border-hairline border-b">
            <button
              type="button"
              id={headerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              className={[
                "flex w-full items-center justify-between gap-4 py-[17px] text-left",
                "min-h-11 font-sans text-[12px] tracking-[0.14em] uppercase text-ink transition-colors",
                "hover:text-ink/70",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              ].join(" ")}
            >
              {item.title}
              {/*
                §05 allows the typographic + / − in IBM Plex Mono here instead
                of an icon. It is decorative: aria-expanded already carries the
                state.
              */}
              <span aria-hidden="true" className="text-accent-gold font-mono text-[24px] leading-none">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              className="mb-[20px] max-w-[56ch] font-sans text-[13.5px] leading-[1.75] text-text-muted"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
