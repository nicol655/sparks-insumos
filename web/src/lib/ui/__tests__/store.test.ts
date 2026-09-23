import { beforeEach, describe, expect, it } from "vitest";

import { isOverlayOpen, useUiStore } from "@/lib/ui/store";

const ui = () => useUiStore.getState();

beforeEach(() => {
  useUiStore.setState({ overlay: null, toasts: [] });
});

describe("ui store", () => {
  it("starts with nothing open", () => {
    expect(ui().overlay).toBeNull();
    expect(isOverlayOpen(ui().overlay)).toBe(false);
  });

  it("opens an overlay", () => {
    ui().open("cart");

    expect(ui().overlay).toBe("cart");
    expect(isOverlayOpen(ui().overlay)).toBe(true);
  });

  it("replaces the open overlay instead of stacking", () => {
    ui().open("menu");
    ui().open("search");

    expect(ui().overlay).toBe("search");
  });

  it("closes", () => {
    ui().open("filters");
    ui().close();

    expect(ui().overlay).toBeNull();
  });

  it("toggles the same overlay off and a different one on", () => {
    ui().toggle("cart");
    expect(ui().overlay).toBe("cart");

    ui().toggle("cart");
    expect(ui().overlay).toBeNull();

    ui().toggle("cart");
    ui().toggle("search");
    expect(ui().overlay).toBe("search");
  });

  it("keeps only the latest toast", () => {
    ui().pushToast("one");
    ui().pushToast("two");

    expect(ui().toasts).toEqual([{ id: expect.any(String), message: "two" }]);
  });

  it("dismisses a toast", () => {
    ui().pushToast("hello");
    const id = ui().toasts[0]?.id;
    expect(id).toBeDefined();

    ui().dismissToast(id as string);

    expect(ui().toasts).toEqual([]);
  });
});
