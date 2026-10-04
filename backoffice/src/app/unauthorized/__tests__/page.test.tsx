import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import UnauthorizedPage from "@/app/unauthorized/page";
import { copy } from "@/copy/es";

describe("unauthorized page", () => {
  it("shows the RF-6 message and a link back to login", () => {
    render(<UnauthorizedPage />);

    expect(screen.getByRole("heading", { level: 1, name: copy.unauthorizedTitle })).toBeInTheDocument();
    expect(screen.getByText(copy.unauthorizedMessage)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.backToLogin })).toHaveAttribute("href", "/login");
    expect(screen.queryByText("Martina Álvarez")).not.toBeInTheDocument();
  });
});
