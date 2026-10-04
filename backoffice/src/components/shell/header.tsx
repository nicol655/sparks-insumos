"use client";

import { storeLinkLabel, storeLinkLabelNarrow } from "@/content/nav";

export function Header({
  crumb,
  storeUrl,
  searchPlaceholder,
  onOpenMenu,
}: {
  crumb: string;
  storeUrl: string;
  searchPlaceholder: string;
  onOpenMenu: () => void;
}) {
  return (
    <header className="border-border-hairline bg-canvas/90 sticky top-0 z-20 grid h-[68px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 backdrop-blur-md lg:gap-7 lg:px-10">
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          aria-label="Menú"
          onClick={onOpenMenu}
          className="flex w-[30px] flex-col gap-[5px] py-2.5 lg:hidden"
        >
          <span className="bg-ink block h-px" />
          <span className="bg-ink block h-px" />
          <span className="bg-ink block h-px" />
        </button>
        <span className="text-text-meta font-mono text-[10px] tracking-[0.18em] whitespace-nowrap uppercase">
          {crumb}
        </span>
      </div>
      <div className="border-border-strong bg-surface-raised mx-auto flex h-10 w-full max-w-[560px] items-center gap-2.5 border px-3.5">
        <span aria-hidden className="text-text-meta font-mono text-[13px]">
          ⌕
        </span>
        <input
          type="search"
          aria-label="Buscar"
          placeholder={searchPlaceholder}
          className="text-ink min-w-0 flex-1 border-0 bg-transparent text-[13.5px] outline-none"
        />
      </div>
      <a
        href={storeUrl}
        aria-label={storeLinkLabel}
        className="border-ink/30 pb-0.75 border-b text-[11px] tracking-[0.16em] whitespace-nowrap uppercase"
      >
        <span className="min-[640px]:hidden">
          {storeLinkLabelNarrow} ↗
        </span>
        <span className="hidden min-[640px]:inline">
          {storeLinkLabel} ↗
        </span>
      </a>
    </header>
  );
}
