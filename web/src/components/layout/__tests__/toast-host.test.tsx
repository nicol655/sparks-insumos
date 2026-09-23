import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ToastHost } from "@/components/layout/toast-host";
import { useUiStore } from "@/lib/ui/store";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

beforeEach(() => {
  useUiStore.setState({ overlay: null, toasts: [] });
});

describe("ToastHost", () => {
  it("announces the queued toast as a live status", () => {
    useUiStore.setState({ toasts: [{ id: "t1", message: "Agregado al carrito" }] });

    renderWithIntl(<ToastHost />);

    expect(screen.getByRole("status")).toHaveTextContent("Agregado al carrito");
  });

  it("has no accessibility violations while a toast is showing", async () => {
    useUiStore.setState({ toasts: [{ id: "t1", message: "Agregado al carrito" }] });
    const { container } = renderWithIntl(<ToastHost />);

    await expectNoA11yViolations(container);
  });
});
