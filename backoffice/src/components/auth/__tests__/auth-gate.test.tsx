import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthGate } from "@/components/auth/auth-gate";
import { useSessionStore } from "@/lib/auth/session-store";

const nav = vi.hoisted(() => ({
  pathname: "/dashboard",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
}));

describe("AuthGate", () => {
  beforeEach(() => {
    nav.replace.mockReset();
    nav.pathname = "/dashboard";
    vi.spyOn(useSessionStore.persist, "rehydrate").mockResolvedValue(undefined);
    useSessionStore.setState({
      accessToken: null,
      mustChangePassword: false,
      hydrated: false,
    });
  });

  it("does not redirect before hydration", async () => {
    render(
      <AuthGate>
        <p>panel</p>
      </AuthGate>,
    );

    expect(screen.getByText("panel")).toBeInTheDocument();
    await waitFor(() => {
      expect(useSessionStore.persist.rehydrate).toHaveBeenCalled();
    });
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("sends an anonymous visitor to the unauthorized page", async () => {
    useSessionStore.setState({ hydrated: true, accessToken: null });
    render(
      <AuthGate>
        <p>panel</p>
      </AuthGate>,
    );

    await waitFor(() => {
      expect(nav.replace).toHaveBeenCalledWith("/unauthorized");
    });
  });

  it("sends a signed-in visitor from login to the dashboard", async () => {
    nav.pathname = "/login";
    useSessionStore.setState({ hydrated: true, accessToken: "tok", mustChangePassword: false });
    render(
      <AuthGate>
        <p>form</p>
      </AuthGate>,
    );

    await waitFor(() => {
      expect(nav.replace).toHaveBeenCalledWith("/dashboard");
    });
  });
});
