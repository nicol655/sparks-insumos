import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Badge, StockBadge } from "@/components/primitives/badge";
import { FilterChip, RemovableFilterChip } from "@/components/primitives/filter-chip";
import { SkeletonCard, SkeletonImage } from "@/components/primitives/skeleton";
import { expectNoA11yViolations } from "@/test/a11y";

/** §03 · chip de filtro. §06: "los filtros como grupo de botones toggle con aria-pressed". */
describe("FilterChip", () => {
  it("exposes its state through aria-pressed", () => {
    const { rerender } = render(
      <FilterChip pressed={false} onToggle={vi.fn()}>
        Gourmand
      </FilterChip>,
    );

    expect(screen.getByRole("button", { name: "Gourmand" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    rerender(
      <FilterChip pressed onToggle={vi.fn()}>
        Gourmand
      </FilterChip>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles on click and on Space", async () => {
    const onToggle = vi.fn();
    render(
      <FilterChip pressed={false} onToggle={onToggle}>
        Gourmand
      </FilterChip>,
    );

    const chip = screen.getByRole("button");
    await userEvent.click(chip);
    chip.focus();
    await userEvent.keyboard(" ");

    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("is the only element carrying the system's single radius", () => {
    render(
      <FilterChip pressed={false} onToggle={vi.fn()}>
        Gourmand
      </FilterChip>,
    );

    expect(screen.getByRole("button").className).toContain("rounded-chip");
  });

  it("cannot be toggled when the combination yields nothing", async () => {
    const onToggle = vi.fn();
    render(
      <FilterChip pressed={false} disabled onToggle={onToggle}>
        Maderas
      </FilterChip>,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FilterChip pressed onToggle={vi.fn()}>
        Gourmand
      </FilterChip>,
    );

    await expectNoA11yViolations(container);
  });
});

describe("RemovableFilterChip", () => {
  it("names the action, not just the value", () => {
    render(
      <RemovableFilterChip removeLabel="Quitar filtro: Gourmand" onRemove={vi.fn()}>
        Gourmand
      </RemovableFilterChip>,
    );

    expect(screen.getByRole("button", { name: "Quitar filtro: Gourmand" })).toBeInTheDocument();
  });

  it("hides the cross from assistive technology", () => {
    render(
      <RemovableFilterChip removeLabel="Quitar filtro: Gourmand" onRemove={vi.fn()}>
        Gourmand
      </RemovableFilterChip>,
    );

    // The accessible name comes from aria-label, so the glyph must not leak in.
    expect(screen.getByRole("button")).toHaveAccessibleName("Quitar filtro: Gourmand");
  });

  it("removes on click", async () => {
    const onRemove = vi.fn();
    render(
      <RemovableFilterChip removeLabel="Quitar filtro: Gourmand" onRemove={onRemove}>
        Gourmand
      </RemovableFilterChip>,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <RemovableFilterChip removeLabel="Quitar filtro: Gourmand" onRemove={vi.fn()}>
        Gourmand
      </RemovableFilterChip>,
    );

    await expectNoA11yViolations(container);
  });
});

describe("Badge", () => {
  it("renders its text", () => {
    render(<Badge>Nuevo</Badge>);

    expect(screen.getByText("Nuevo")).toBeInTheDocument();
  });

  it("switches to the muted background when sold out", () => {
    render(<Badge tone="muted">Sin stock</Badge>);

    expect(screen.getByText("Sin stock").className).toContain("bg-text-meta");
  });
});

describe("StockBadge", () => {
  it("never relies on colour alone", () => {
    const { rerender } = render(<StockBadge inStock>En stock</StockBadge>);
    expect(screen.getByText("En stock")).toBeInTheDocument();

    rerender(<StockBadge inStock={false}>Sin stock</StockBadge>);
    expect(screen.getByText("Sin stock")).toBeInTheDocument();
  });

  it("uses ink when there is stock so 10px type still meets AA", () => {
    const { rerender } = render(<StockBadge inStock>En stock</StockBadge>);
    expect(screen.getByText("En stock").className).toContain("text-ink");

    rerender(<StockBadge inStock={false}>Sin stock</StockBadge>);
    expect(screen.getByText("Sin stock").className).toContain("text-text-meta");
  });
});

describe("Skeleton", () => {
  it("draws the diagonal pattern of §05 with no shimmer", () => {
    const { container } = render(<SkeletonImage />);
    const box = container.firstElementChild;

    expect(box?.className).toContain("repeating-linear-gradient(135deg");
    expect(box?.className).not.toMatch(/animate-/);
  });

  it("hides the decorative boxes from assistive technology", () => {
    const { container } = render(<SkeletonImage />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("announces the card placeholder once", () => {
    render(<SkeletonCard label="Cargando" />);

    expect(screen.getByRole("status", { name: "Cargando" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<SkeletonCard label="Cargando" />);

    await expectNoA11yViolations(container);
  });
});
