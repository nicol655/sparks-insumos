import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LiveResults } from "@/components/search/live-results";
import { SEARCH_RESULT_LIMIT } from "@/lib/api/repository";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

describe("LiveResults", () => {
  it("stays silent below two characters and lists at most four matches after that", async () => {
    const { rerender } = renderWithIntl(<LiveResults term="k" onSuggest={() => undefined} />);

    expect(screen.queryByRole("list", { name: "Resultados de búsqueda" })).not.toBeInTheDocument();

    rerender(<LiveResults term="va" onSuggest={() => undefined} />);

    const list = await screen.findByRole("list", { name: "Resultados de búsqueda" });
    expect(within(list).getAllByRole("listitem").length).toBeLessThanOrEqual(SEARCH_RESULT_LIMIT);
    expect(list.className).toContain("minmax(220px,1fr)");
    expect(within(list).getAllByRole("link")[0]).toHaveTextContent(/\$/);
  });

  it("offers note and brand chips before anything is typed", async () => {
    const onSuggest = vi.fn();
    renderWithIntl(<LiveResults term="" onSuggest={onSuggest} />);

    const group = await screen.findByRole("group", { name: "Sugerencias" });
    const chips = within(group).getAllByRole("button");
    expect(chips.length).toBeGreaterThan(1);

    await userEvent.click(chips[0]!);
    expect(onSuggest).toHaveBeenCalledOnce();
    expect(onSuggest.mock.calls[0]?.[0]).toEqual(chips[0]!.textContent);
  });

  it("says so when nothing matches", async () => {
    renderWithIntl(<LiveResults term="zzzz" onSuggest={() => undefined} />);

    expect(await screen.findByText("Nada con ese término")).toBeInTheDocument();
  });

  it("has no accessibility violations with results on screen", async () => {
    const { container } = renderWithIntl(<LiveResults term="lattafa" onSuggest={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole("list", { name: "Resultados de búsqueda" })).toBeInTheDocument();
    });

    await expectNoA11yViolations(container);
  });
});
