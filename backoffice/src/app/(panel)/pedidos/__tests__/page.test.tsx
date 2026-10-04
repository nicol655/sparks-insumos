import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PedidosPage from "@/app/(panel)/pedidos/page";

describe("pedidos page", () => {
  it("shows the title and none of the order list", () => {
    render(<PedidosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Pedidos" })).toBeInTheDocument();
    expect(screen.queryByText("Exportar CSV")).not.toBeInTheDocument();
    expect(screen.queryByText("SP-10482")).not.toBeInTheDocument();
  });
});
