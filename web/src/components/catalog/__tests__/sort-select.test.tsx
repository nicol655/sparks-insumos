import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SortSelect } from "@/components/catalog/sort-select";
import { catalogQuerySchema } from "@/lib/api/contract";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const assign = vi.hoisted(() => vi.fn());

describe("SortSelect", () => {
  beforeEach(() => {
    assign.mockReset();
    vi.stubGlobal("location", { pathname: "/es/catalogo", search: "", assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes the chosen sort into the URL", async () => {
    renderWithIntl(<SortSelect query={catalogQuerySchema.parse({})} />);

    await userEvent.selectOptions(screen.getByLabelText("Ordenar"), "price-asc");

    expect(assign).toHaveBeenCalledWith("/es/catalogo?sort=price-asc");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<SortSelect query={catalogQuerySchema.parse({})} />);

    await expectNoA11yViolations(container);
  });
});
