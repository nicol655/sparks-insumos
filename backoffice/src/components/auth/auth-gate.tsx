"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { redirectAfterSessionEnd } from "@/lib/auth/end-session";
import { decideRedirect } from "@/lib/auth/guard";
import { useSessionStore } from "@/lib/auth/session-store";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.hydrated);

  useEffect(() => {
    void useSessionStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const next = redirectAfterSessionEnd(decideRedirect(pathname, accessToken !== null, hydrated));
    if (next) router.replace(next);
  }, [pathname, accessToken, hydrated, router]);

  return children;
}
