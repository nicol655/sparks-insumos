import { screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { Footer } from "@/components/layout/footer";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string; query?: Record<string, string> };
    children: ReactNode;
  } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) => {
    const resolved =
      typeof href === "string"
        ? href
        : href.query
          ? `${href.pathname}?${new URLSearchParams(href.query).toString()}`
          : href.pathname;
    return (
      <a href={resolved} {...rest}>
        {children}
      </a>
    );
  },
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("Footer", () => {
  it("exposes shop, account and help columns, socials, and a copyright bar", () => {
    renderWithIntl(<Footer />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sparks Parfums — inicio" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("navigation", { name: "Tienda" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Cuenta" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Ayuda" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/catalogo");
    expect(screen.getByRole("link", { name: "Ámbar & especias" })).toHaveAttribute(
      "href",
      "/es/catalogo?family=ambar-especias",
    );
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/registro");
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/sparks.insumos",
    );
    expect(screen.getByRole("link", { name: "TikTok" })).toHaveAttribute(
      "href",
      "https://www.tiktok.com/@sparks.insumos",
    );
    expect(screen.getByRole("link", { name: "Facebook" })).toHaveAttribute(
      "href",
      "https://www.facebook.com/sparks.insumos",
    );
    expect(
      screen.getByText(`© ${new Date().getFullYear()} Sparks Parfums · Buenos Aires, Argentina`),
    ).toBeInTheDocument();
    expect(screen.getByText("Defensa de consumidores · Botón de arrepentimiento")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "WhatsApp" })).not.toBeInTheDocument();
  });

  it("translates the chrome", () => {
    renderWithIntl(<Footer />, { locale: "en" });

    expect(screen.getByRole("navigation", { name: "Shop" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Help" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/registro");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Footer />);

    await expectNoA11yViolations(container);
  });
});
