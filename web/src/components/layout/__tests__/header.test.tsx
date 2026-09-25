import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "@/components/layout/header";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Wordmark } from "@/components/layout/wordmark";
import { useCartStore } from "@/lib/cart/store";
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
  useRouter: () => ({ replace }),
}));

beforeEach(() => {
  replace.mockReset();
  useUiStore.setState({ overlay: null, toasts: [] });
  useCartStore.setState({ items: [], hydrated: true });
});

describe("Wordmark", () => {
  it("is a home link named after the site, not after the letters of the logo", () => {
    renderWithIntl(<Wordmark />);

    expect(screen.getByRole("link", { name: "Sparks Parfums — inicio" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});

describe("LanguageSwitcher", () => {
  it("marks the current language and offers the other one", () => {
    renderWithIntl(<LanguageSwitcher />);

    expect(screen.getByRole("button", { name: "Ver el sitio en Español" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Ver el sitio en Inglés" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("replaces the current path with the other locale, without a full reload", async () => {
    renderWithIntl(<LanguageSwitcher />);

    await userEvent.click(screen.getByRole("button", { name: "Ver el sitio en Inglés" }));

    expect(replace).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledOnce();
    expect(replace.mock.calls[0]?.[0]).toEqual({ pathname: "/", params: {} });
    expect(replace.mock.calls[0]?.[1]).toEqual({ locale: "en" });
  });

  it("does not navigate when the current language is clicked", async () => {
    renderWithIntl(<LanguageSwitcher />);

    await userEvent.click(screen.getByRole("button", { name: "Ver el sitio en Español" }));

    expect(replace).not.toHaveBeenCalled();
  });
});

describe("Header", () => {
  it("exposes the primary navigation and the wordmark", () => {
    renderWithIntl(<Header />);

    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/catalogo");
    expect(screen.getByRole("link", { name: "Sparks Parfums — inicio" })).toBeInTheDocument();
  });

  it("opens search, cart and the mobile menu through the overlay store", async () => {
    renderWithIntl(<Header />);

    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
    expect(useUiStore.getState().overlay).toBe("search");

    await userEvent.click(screen.getByRole("button", { name: "Carrito vacío" }));
    expect(useUiStore.getState().overlay).toBe("cart");

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(useUiStore.getState().overlay).toBe("menu");
  });

  it("announces the number of units in the cart", () => {
    useCartStore.setState({
      items: [{ productId: "prd-001", slug: "bharara-king", quantity: 3 }],
      hydrated: true,
    });

    renderWithIntl(<Header />);

    const cart = screen.getByRole("button", { name: "3 productos en el carrito" });
    expect(cart).toBeInTheDocument();
    expect(cart).toHaveAttribute("aria-controls", "cart-drawer");
    expect(cart).toHaveAttribute("id", "header-cart");
    expect(cart).toHaveAttribute("data-hydrated", "true");

    const search = screen.getByRole("button", { name: "Buscar" });
    expect(search).toHaveAttribute("id", "header-search");
    expect(search).toHaveAttribute("aria-controls", "search-overlay");
  });

  it("keeps the header count at empty until the persisted cart hydrates", () => {
    useCartStore.setState({
      items: [{ productId: "prd-001", slug: "bharara-king", quantity: 3 }],
      hydrated: false,
    });

    renderWithIntl(<Header />);

    expect(screen.getByRole("button", { name: "Carrito vacío" })).toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("tells assistive technology when the mobile menu is open", () => {
    useUiStore.setState({ overlay: "menu" });
    renderWithIntl(<Header />);

    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("tells assistive technology when search is open", () => {
    useUiStore.setState({ overlay: "search" });
    renderWithIntl(<Header />);

    expect(screen.getByRole("button", { name: "Buscar" })).toHaveAttribute("aria-expanded", "true");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Header />);

    await expectNoA11yViolations(container);
  });
});

describe("Header · English", () => {
  it("translates the chrome", () => {
    renderWithIntl(<Header />, { locale: "en" });

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Catalogue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cart is empty" })).toBeInTheDocument();
  });
});

