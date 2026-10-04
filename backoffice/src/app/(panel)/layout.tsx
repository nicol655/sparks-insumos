import type { ReactNode } from "react";

import { Shell } from "@/components/shell/shell";
import { env } from "@/lib/env";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <Shell storeUrl={env.storeUrl}>{children}</Shell>;
}
