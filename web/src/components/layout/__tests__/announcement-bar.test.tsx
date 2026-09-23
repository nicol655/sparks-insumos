import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

describe("AnnouncementBar", () => {
  it("renders the three messages from the specification", () => {
    renderWithIntl(<AnnouncementBar enabled />);

    expect(screen.getByText("5% OFF desde $100.000")).toBeInTheDocument();
    expect(screen.getByText("10% OFF desde $300.000")).toBeInTheDocument();
    expect(screen.getByText("Envíos a todo el país")).toBeInTheDocument();
  });

  it("renders nothing when the configuration turns it off", () => {
    const { container } = renderWithIntl(<AnnouncementBar enabled={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("translates the copy", () => {
    renderWithIntl(<AnnouncementBar enabled />, { locale: "en" });

    expect(screen.getByText("5% off over $100,000")).toBeInTheDocument();
    expect(screen.getByText("We ship nationwide")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<AnnouncementBar enabled />);

    await expectNoA11yViolations(container);
  });
});
