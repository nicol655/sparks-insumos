"use client";

import Link from "next/link";

import { brand, navGroups, operator } from "@/content/nav";

export function Sidebar({
  pathname,
  open,
  onNavigate,
}: {
  pathname: string;
  open: boolean;
  onNavigate: () => void;
}) {
  return (
    <aside
      className={`bg-ink text-canvas z-40 flex h-screen w-[248px] flex-col max-lg:fixed max-lg:inset-y-0 max-lg:left-0 ${
        open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      } lg:sticky lg:top-0 lg:translate-x-0`}
    >
      <div className="border-canvas/12 flex flex-col gap-1 border-b px-6 pt-7 pb-5">
        <span className="font-display text-[25px] tracking-[0.26em] uppercase">{brand.name}</span>
        <span className="text-canvas/55 font-mono text-[9px] tracking-[0.3em] uppercase">{brand.kicker}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            <span className="text-canvas/55 px-3 pt-1.5 pb-2 font-mono text-[9px] tracking-[0.22em] uppercase">
              {group.title}
            </span>
            {group.items.map((item) => {
              const current = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  onClick={onNavigate}
                  className={`flex items-center justify-between gap-2.5 px-3 py-2.5 text-[13.5px] ${
                    current ? "bg-canvas text-ink" : "text-canvas hover:bg-canvas/7"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count ? (
                    <span className={`font-mono text-[10px] ${current ? "text-ink" : "text-accent-gold"}`}>
                      {item.count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-canvas/12 flex items-center gap-3 border-t px-5 py-4">
        <span className="border-canvas/20 flex size-9 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]">
          {operator.initials}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[13px]">{operator.name}</span>
          <span className="text-canvas/55 font-mono text-[9px] tracking-[0.14em] uppercase">{operator.role}</span>
        </span>
      </div>
    </aside>
  );
}
