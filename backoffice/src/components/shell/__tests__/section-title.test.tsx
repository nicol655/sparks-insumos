import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionTitle } from "@/components/shell/section-title";
import { sectionTitles } from "@/content/sections";
import ContenidoPage from "@/app/(panel)/contenido/page";
import CuponesPage from "@/app/(panel)/cupones/page";
import MensajesPage from "@/app/(panel)/mensajes/page";
import PedidosPage from "@/app/(panel)/pedidos/page";

const pages = [
  [PedidosPage, sectionTitles.pedidos],
  [MensajesPage, sectionTitles.mensajes],
  [CuponesPage, sectionTitles.cupones],
  [ContenidoPage, sectionTitles.contenido],
] as const;

describe("section title", () => {
  it.each(Object.values(sectionTitles))("renders %s as the only heading level", (title) => {
    render(<SectionTitle title={title} />);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
  });

  it.each(pages)("page %s has no table", (Page, title) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
