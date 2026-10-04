import type { ReactNode } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { fontVariables } from "@/styles/fonts";

import "./globals.css";

export const metadata = {
  title: "Sparks Backoffice",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={`${fontVariables} bg-canvas text-ink antialiased`}>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
