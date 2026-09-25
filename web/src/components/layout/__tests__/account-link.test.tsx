import { screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountLink } from "@/components/layout/account-link";
import { SIGNED_IN_COOKIE } from "@/lib/auth/session";
import { renderWithIntl } from "@/test/i18n";

const path = vi.hoisted(() => ({ value: "/catalogo" }));

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
  usePathname: () => path.value,
}));

describe("AccountLink", () => {
  afterEach(() => {
    document.cookie = `${SIGNED_IN_COOKIE}=; Max-Age=0`;
    path.value = "/catalogo";
  });

  it("starts as sign-in and keeps the current path as next", () => {
    renderWithIntl(<AccountLink />);

    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute(
      "href",
      "/ingresar?next=%2Fes%2Fcatalogo",
    );
  });

  it("uses the English catalogue path", () => {
    renderWithIntl(<AccountLink />, { locale: "en" });

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/ingresar?next=%2Fen%2Fcatalogue",
    );
  });

  it("shows the account once the presence cookie is read", async () => {
    document.cookie = `${SIGNED_IN_COOKIE}=1`;
    renderWithIntl(<AccountLink />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
    });
  });
});
