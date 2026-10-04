import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";
import { copy } from "@/copy/es";
import type { LoginResult } from "@/lib/auth/actions";
import { useSessionStore } from "@/lib/auth/session-store";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/login",
}));

describe("login form", () => {
  beforeEach(() => {
    push.mockReset();
    sessionStorage.clear();
    localStorage.clear();
    useSessionStore.setState({
      accessToken: null,
      mustChangePassword: false,
      hydrated: true,
    });
  });

  it("does not call login when a field is empty", async () => {
    const login = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm login={login} />);

    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(login).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(copy.missingFields);
  });

  it("submits the email in lowercase", async () => {
    const login = vi.fn<(input: { email: string; password: string }) => Promise<LoginResult>>(
      () => Promise.resolve({ ok: false, code: "invalid_credentials" }),
    );
    const user = userEvent.setup();
    render(<LoginForm login={login} />);

    await user.type(screen.getByLabelText(copy.emailLabel), "Ana@Sparks.com");
    await user.type(screen.getByLabelText(copy.passwordLabel), "Secreta1!");
    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(login).toHaveBeenCalledWith({ email: "ana@sparks.com", password: "Secreta1!" });
  });

  it("shows invalid credentials and does not navigate", async () => {
    const login = vi.fn((): Promise<LoginResult> =>
      Promise.resolve({ ok: false, code: "invalid_credentials" }),
    );
    const user = userEvent.setup();
    render(<LoginForm login={login} />);

    await user.type(screen.getByLabelText(copy.emailLabel), "ana@sparks.com");
    await user.type(screen.getByLabelText(copy.passwordLabel), "nope");
    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(copy.invalidCredentials);
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows forbidden when the role cannot use the panel", async () => {
    const login = vi.fn((): Promise<LoginResult> =>
      Promise.resolve({ ok: false, code: "forbidden" }),
    );
    const user = userEvent.setup();
    render(<LoginForm login={login} />);

    await user.type(screen.getByLabelText(copy.emailLabel), "ana@sparks.com");
    await user.type(screen.getByLabelText(copy.passwordLabel), "Sparks1!");
    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(copy.forbidden);
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the outage message when login is unavailable", async () => {
    const login = vi.fn((): Promise<LoginResult> =>
      Promise.resolve({ ok: false, code: "unavailable" }),
    );
    const user = userEvent.setup();
    render(<LoginForm login={login} />);

    await user.type(screen.getByLabelText(copy.emailLabel), "ana@sparks.com");
    await user.type(screen.getByLabelText(copy.passwordLabel), "nope");
    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(copy.unavailable);
    expect(push).not.toHaveBeenCalled();
  });

  it("stores the token and opens the dashboard", async () => {
    const login = vi.fn(() =>
      Promise.resolve({ ok: true as const, accessToken: "tok", mustChangePassword: false }),
    );
    const user = userEvent.setup();
    render(<LoginForm login={login} />);

    await user.type(screen.getByLabelText(copy.emailLabel), "ana@sparks.com");
    await user.type(screen.getByLabelText(copy.passwordLabel), "Secreta1!");
    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(useSessionStore.getState().accessToken).toBe("tok");
    expect(useSessionStore.getState().mustChangePassword).toBe(false);
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("also enters when the password must change", async () => {
    const login = vi.fn(() =>
      Promise.resolve({ ok: true as const, accessToken: "tok", mustChangePassword: true }),
    );
    const user = userEvent.setup();
    render(<LoginForm login={login} />);

    await user.type(screen.getByLabelText(copy.emailLabel), "ana@sparks.com");
    await user.type(screen.getByLabelText(copy.passwordLabel), "admin123456");
    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(useSessionStore.getState().mustChangePassword).toBe(true);
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("toggles the password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm login={vi.fn()} />);

    const input = screen.getByLabelText(copy.passwordLabel);
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: copy.showPassword }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: copy.hidePassword })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
