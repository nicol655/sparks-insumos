import { screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Related } from "@/components/product/related";
import { catalogFor } from "@/fixtures/catalog";
import { useCartStore } from "@/lib/cart/store";
import { useUiStore } from "@/lib/ui/store";
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
    href: string | { pathname: string; params?: Record<string, string> };
    children: ReactNode;
  } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) => {
    const resolved =
      typeof href === "string"
        ? href
        : href.pathname.replace("[slug]", href.params?.slug ?? "");
    return (
      <a href={resolved} {...rest}>
        {children}
      </a>
    );
  },
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

const related = catalogFor("es")
  .filter((item) => item.slug !== "bharara-king")
  .slice(0, 2);

beforeEach(() => {
  useCartStore.setState({ items: [], hydrated: true });
  useUiStore.setState({ overlay: null });
});

describe("Related", () => {
  it("shows an empty state when the repository returns nothing", () => {
    renderWithIntl(<Related products={[]} />);

    expect(screen.getByRole("heading", { name: "También te puede gustar" })).toBeInTheDocument();
    expect(screen.getByText("Todavía no hay sugerencias.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("translates the empty state", () => {
    renderWithIntl(<Related products={[]} />, { locale: "en" });

    expect(screen.getByRole("heading", { name: "You may also like" })).toBeInTheDocument();
    expect(screen.getByText("Nothing to suggest yet.")).toBeInTheDocument();
  });

  it("lists name and price without an add button", () => {
    renderWithIntl(<Related products={related} />);

    expect(screen.getByRole("list", { name: "Productos relacionados" })).toBeInTheDocument();
    expect(screen.getByText(related[0]!.name)).toBeInTheDocument();
    expect(screen.getByText(related[1]!.name)).toBeInTheDocument();
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Agregar" })).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Related products={related} />);

    await expectNoA11yViolations(container);
  });
});
