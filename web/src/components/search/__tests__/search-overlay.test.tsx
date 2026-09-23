import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "@/components/layout/header";
import { SearchOverlay } from "@/components/search/search-overlay";
import { useCartStore } from "@/lib/cart/store";
import { useUiStore } from "@/lib/ui/store";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const assign = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

beforeEach(() => {
  assign.mockReset();
  vi.stubGlobal("location", { assign });
  useUiStore.setState({ overlay: null, toasts: [] });
  useCartStore.setState({ items: [], hydrated: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderSearch() {
  return renderWithIntl(
    <>
      <Header />
      <SearchOverlay />
    </>,
  );
}

describe("SearchOverlay", () => {
  it("is not in the document until the header opens it", () => {
    renderSearch();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("focuses the input on open and restores the trigger on Escape (AC-12)", async () => {
    renderSearch();

    const trigger = screen.getByRole("button", { name: "Buscar" });
    await userEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Buscar" });
    expect(dialog).toHaveAttribute("id", "search-overlay");
    expect(screen.getByRole("searchbox")).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    expect(useUiStore.getState().overlay).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on backdrop click and returns focus to the trigger", async () => {
    renderSearch();

    const trigger = screen.getByRole("button", { name: "Buscar" });
    await userEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Buscar" });
    await userEvent.click(dialog.parentElement!.firstElementChild as HTMLElement);

    expect(useUiStore.getState().overlay).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("navigates to the catalogue with the term on Enter", async () => {
    renderSearch();

    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await userEvent.type(screen.getByRole("searchbox"), "vainilla");
    await userEvent.keyboard("{Enter}");

    expect(assign).toHaveBeenCalledWith("/es/catalogo?q=vainilla");
    expect(useUiStore.getState().overlay).toBeNull();
  });

  it("has no accessibility violations while open", async () => {
    useUiStore.setState({ overlay: "search" });
    const { container } = renderWithIntl(<SearchOverlay />);

    await waitFor(() => {
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    await expectNoA11yViolations(container);
  });
});
