import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { Header } from "@/components/layout/header";
import { catalogFor } from "@/fixtures/catalog";
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
    onClick,
    ...rest
  }: {
    href: string | { pathname: string; query?: Record<string, string>; params?: Record<string, string> };
    children: ReactNode;
    onClick?: () => void;
  } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) => {
    const path =
      typeof href === "string"
        ? href
        : href.pathname.replace("[slug]", href.params?.slug ?? "");
    const resolved =
      typeof href !== "string" && href.query
        ? `${path}?${new URLSearchParams(href.query).toString()}`
        : path;
    return (
      <a href={resolved} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  },
  usePathname: () => "/",
  useRouter: () => ({ replace }),
}));

const king = catalogFor("es").find((product) => product.slug === "bharara-king")!;

beforeEach(() => {
  replace.mockReset();
  useUiStore.setState({ overlay: null, toasts: [] });
  useCartStore.setState({ items: [], hydrated: true });
});

function renderDrawer() {
  return renderWithIntl(
    <>
      <Header />
      <CartDrawer />
    </>,
  );
}

describe("CartDrawer", () => {
  it("is not in the document until the header opens it", () => {
    renderDrawer();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a labelled dialog with the empty state in display italic", async () => {
    renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: "Carrito vacío" }));

    const drawer = screen.getByRole("dialog", { name: "Carrito" });
    expect(drawer).toHaveAttribute("id", "cart-drawer");
    expect(within(drawer).getByText("Tu carrito está vacío")).toBeInTheDocument();
    expect(within(drawer).getByRole("link", { name: "Ver catálogo" })).toHaveAttribute(
      "href",
      "/catalogo",
    );
    expect(within(drawer).getByRole("button", { name: "Cerrar carrito" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the cart button (AC-11)", async () => {
    renderDrawer();

    const trigger = screen.getByRole("button", { name: "Carrito vacío" });
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");

    expect(useUiStore.getState().overlay).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("lists a resolved line, the subtotal and a WhatsApp CTA", async () => {
    useCartStore.setState({
      items: [{ productId: king.id, slug: king.slug, quantity: 1 }],
      hydrated: true,
    });
    useUiStore.setState({ overlay: "cart" });
    renderWithIntl(<CartDrawer />);

    const drawer = await screen.findByRole("dialog", { name: "Carrito" });
    await waitFor(() => {
      expect(within(drawer).getByRole("link", { name: "King" })).toBeInTheDocument();
    });

    expect(within(drawer).getByRole("link", { name: "Ver carrito" })).toHaveAttribute(
      "href",
      "/carrito",
    );
    expect(within(drawer).getByRole("link", { name: "Pedir por WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/wa\.me\/5491168692694\?text=/),
    );
  });

  it("has no accessibility violations while open", async () => {
    useUiStore.setState({ overlay: "cart" });
    const { container } = renderWithIntl(<CartDrawer />);

    await expectNoA11yViolations(container);
  });
});
