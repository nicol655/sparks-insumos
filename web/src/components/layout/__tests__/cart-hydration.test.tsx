import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rehydrateCart = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock("@/lib/cart/store", () => ({
  rehydrateCart,
}));

import { CartHydration } from "@/components/layout/cart-hydration";

describe("CartHydration", () => {
  beforeEach(() => {
    rehydrateCart.mockClear();
  });

  it("rehydrates the persisted cart after the first paint", () => {
    render(<CartHydration />);

    expect(rehydrateCart).toHaveBeenCalledOnce();
  });

  it("renders nothing", () => {
    const { container } = render(<CartHydration />);

    expect(container).toBeEmptyDOMElement();
  });
});
