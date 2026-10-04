import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginScreen } from "@/components/auth/login-screen";
import { copy } from "@/copy/es";
import { expectNoA11yViolations } from "@/test/a11y";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/login",
}));

describe("login screen", () => {
  it("shows the Sparks sign-in form and no example-brand links", async () => {
    const { container } = render(<LoginScreen login={() => Promise.resolve({ ok: false, code: "unavailable" })} />);

    expect(screen.getByRole("heading", { level: 1, name: copy.loginTitle })).toBeInTheDocument();
    expect(screen.getByLabelText(copy.emailLabel)).toHaveAttribute("placeholder", copy.emailPlaceholder);
    expect(screen.getByLabelText(copy.passwordLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.submit })).toBeInTheDocument();
    expect(screen.getByText(copy.wordmark)).toBeInTheDocument();
    expect(screen.getByText(copy.wordmarkSub)).toBeInTheDocument();

    for (const line of copy.lines) {
      const title = screen.getByText(new RegExp(line.title));
      expect(title.closest("a")).toBeNull();
    }

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Martina Álvarez")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/ADS/i);
    expect(container.textContent).not.toMatch(/adsinversiones/i);

    await expectNoA11yViolations(container);
  });
});
