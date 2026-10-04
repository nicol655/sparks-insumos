import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DashboardPage from "@/app/(panel)/dashboard/page";

describe("dashboard page", () => {
  it("renders the resumen fichas", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Buen día, Martina." })).toBeInTheDocument();
    expect(screen.getByText("Ventas · 14 días")).toBeInTheDocument();
    expect(screen.getByText("Ticket promedio")).toBeInTheDocument();
    expect(screen.getByText("Socios del club")).toBeInTheDocument();
    expect(screen.getAllByText("$2.758.000").length).toBeGreaterThan(0);
  });
});
