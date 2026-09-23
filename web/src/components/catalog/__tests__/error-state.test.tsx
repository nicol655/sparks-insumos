import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "@/components/catalog/error-state";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

describe("ErrorState", () => {
  it("retries when asked", async () => {
    const onRetry = vi.fn();
    renderWithIntl(<ErrorState onRetry={onRetry} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "No pudimos cargar el catálogo",
    );
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ErrorState onRetry={() => undefined} />);

    await expectNoA11yViolations(container);
  });
});
