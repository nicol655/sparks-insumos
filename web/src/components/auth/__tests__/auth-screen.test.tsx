import { screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AuthScreen } from "@/components/auth/auth-screen";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

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
}));

const noop = async () => undefined;

describe("AuthScreen", () => {
  it("renders the Spanish sign-in shell without an alert", () => {
    renderWithIntl(
      <AuthScreen mode="login">
        <LoginForm next={null} action={noop} />
      </AuthScreen>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Bienvenida de vuelta." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/registro");
    expect(screen.getByRole("link", { name: "Crear cuenta" })).not.toHaveAttribute("aria-current");
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Ingresar" })).toHaveAttribute("type", "submit");
    expect(screen.getByText("Sparks Club")).toBeInTheDocument();
    expect(screen.getByText("Precio de socio")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText(/WhatsApp/).closest("a")).toBeNull();
  });

  it("renders the English sign-in shell", () => {
    renderWithIntl(
      <AuthScreen mode="login">
        <LoginForm next={null} action={noop} />
      </AuthScreen>,
      { locale: "en" },
    );

    expect(screen.getByRole("heading", { level: 1, name: "Welcome back." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/registro");
    expect(screen.getByText("Sparks Club")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the register shell with the create-account tab current and a plain foot", () => {
    renderWithIntl(
      <AuthScreen mode="register">
        <RegisterForm action={noop} />
      </AuthScreen>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Creá tu cuenta." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/ingresar");
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Apellido")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Teléfono / WhatsApp")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByText(/términos/).closest("a")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(
      <AuthScreen mode="login">
        <LoginForm next={null} action={noop} />
      </AuthScreen>,
    );

    await expectNoA11yViolations(container);
  });
});
