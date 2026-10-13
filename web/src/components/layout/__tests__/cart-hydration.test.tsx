import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loadSessionCart = vi.hoisted(() => vi.fn());
const usePathname = vi.hoisted(() => vi.fn(() => "/es/catalogo"));

vi.mock("@/i18n/navigation", () => ({
  usePathname,
}));

vi.mock("@/lib/cart/browser", () => ({
  loadSessionCart,
}));

vi.mock("@/lib/cart/hydrate-session", () => ({
  hydrateCartSession: vi.fn(),
}));

import { CartHydration } from "@/components/layout/cart-hydration";
import { hydrateCartSession } from "@/lib/cart/hydrate-session";

beforeEach(() => {
  vi.mocked(hydrateCartSession).mockReset();
  loadSessionCart.mockReset();
  usePathname.mockReturnValue("/es/catalogo");
});

describe("CartHydration", () => {
  it("starts session cart hydration after the first paint", async () => {
    render(<CartHydration />);

    await waitFor(() => {
      expect(hydrateCartSession).toHaveBeenCalledOnce();
    });
    expect(hydrateCartSession).toHaveBeenCalledWith(loadSessionCart);
  });

  it("re-runs hydration when the pathname changes after login", async () => {
    usePathname.mockReturnValue("/es/ingresar");
    const { rerender } = render(<CartHydration />);

    await waitFor(() => {
      expect(hydrateCartSession).toHaveBeenCalledOnce();
    });

    usePathname.mockReturnValue("/es/catalogo");
    rerender(<CartHydration />);

    await waitFor(() => {
      expect(hydrateCartSession).toHaveBeenCalledTimes(2);
    });
  });

  it("refetches when the tab becomes visible again", async () => {
    document.cookie = "sparks_signed_in=1";
    render(<CartHydration />);

    await waitFor(() => {
      expect(hydrateCartSession).toHaveBeenCalledOnce();
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => {
      expect(hydrateCartSession).toHaveBeenCalledTimes(2);
    });
  });

  it("renders nothing", () => {
    const { container } = render(<CartHydration />);
    expect(container).toBeEmptyDOMElement();
  });
});
