"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { Header } from "@/components/shell/header";
import { Sidebar } from "@/components/shell/sidebar";
import { crumbFor, searchPlaceholder, searchPlaceholderNarrow } from "@/content/nav";

function useNarrow(maxPx: number): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const media = window.matchMedia(`(max-width: ${maxPx}px)`);
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [maxPx]);

  return narrow;
}

export function Shell({ children, storeUrl }: { children: ReactNode; storeUrl: string }) {
  const pathname = usePathname();
  const narrow = useNarrow(639);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="bg-canvas text-ink min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <Sidebar pathname={pathname} open={menuOpen} onNavigate={closeMenu} />
      {menuOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="bg-ink/45 fixed inset-0 z-30 lg:hidden"
          onClick={closeMenu}
        />
      ) : null}
      <div className="flex min-w-0 flex-col">
        <Header
          crumb={crumbFor(pathname)}
          storeUrl={storeUrl}
          searchPlaceholder={narrow ? searchPlaceholderNarrow : searchPlaceholder}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main className="mx-auto flex w-full max-w-[1760px] flex-col gap-7 px-4 pt-6 pb-20 lg:px-10 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}
