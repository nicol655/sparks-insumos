import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { useUiStore } from "@/lib/ui/store";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    onClick,
    ...rest
  }: { href: string; children: ReactNode; onClick?: () => void } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ replace }),
}));

beforeEach(() => {
  replace.mockReset();
  useUiStore.setState({ overlay: null });
});

function renderMenu() {
  return renderWithIntl(
    <>
      <Header />
      <MobileMenu />
    </>,
  );
}

describe("MobileMenu", () => {
  it("is not in the document until the hamburger opens it", () => {
    renderMenu();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a labelled dialog and moves focus to the close button", async () => {
    renderMenu();

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }));

    expect(screen.getByRole("dialog", { name: "Menú" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveFocus();
  });

  it("lists the primary routes, the language switcher and a WhatsApp CTA", async () => {
    renderMenu();
    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    const menu = within(screen.getByRole("dialog"));

    expect(menu.getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/catalogo");
    expect(menu.getByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/ingresar");
    expect(menu.getByRole("button", { name: "Ver el sitio en Inglés" })).toBeInTheDocument();
    expect(menu.getByRole("link", { name: "Consultar por WhatsApp" })).toHaveAttribute(
      "href",
      "https://wa.me/5491168692694?text=Hola%20Sparks%2C%20quer%C3%ADa%20hacer%20una%20consulta.",
    );
  });

  it("closes on Escape and returns focus to the hamburger", async () => {
    renderMenu();

    const hamburger = screen.getByRole("button", { name: "Abrir menú" });
    await userEvent.click(hamburger);
    await userEvent.keyboard("{Escape}");

    expect(useUiStore.getState().overlay).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(hamburger).toHaveFocus();
  });

  it("closes when a route is chosen", async () => {
    renderMenu();
    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Catálogo" }));

    expect(useUiStore.getState().overlay).toBeNull();
  });

  it("has no accessibility violations while open", async () => {
    useUiStore.setState({ overlay: "menu" });
    const { container } = renderWithIntl(<MobileMenu />);

    await expectNoA11yViolations(container);
  });
});
