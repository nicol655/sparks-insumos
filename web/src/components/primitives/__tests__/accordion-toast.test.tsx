import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Accordion, type AccordionItem } from "@/components/primitives/accordion";
import { Toast, TOAST_DURATION_MS } from "@/components/primitives/toast";
import { expectNoA11yViolations } from "@/test/a11y";

const ITEMS: AccordionItem[] = [
  { id: "description", title: "Descripción", content: "Notas de ámbar y vainilla." },
  { id: "shipping", title: "Envíos", content: "Despacho en 48 horas." },
  { id: "returns", title: "Devoluciones", content: "Cambios dentro de 30 días." },
];

/** §03 · uno o varios paneles pueden estar abiertos a la vez. */
describe("Accordion", () => {
  it("starts closed and hides the panels", () => {
    render(<Accordion items={ITEMS} />);

    for (const item of ITEMS) {
      expect(screen.getByRole("button", { name: item.title })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    }
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("opens a panel and links it back to its header", async () => {
    render(<Accordion items={ITEMS} />);

    await userEvent.click(screen.getByRole("button", { name: "Descripción" }));

    const header = screen.getByRole("button", { name: "Descripción" });
    const panel = screen.getByRole("region", { name: "Descripción" });

    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(header.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel).toHaveTextContent("Notas de ámbar y vainilla.");
  });

  it("keeps several panels open at once", async () => {
    render(<Accordion items={ITEMS} />);

    await userEvent.click(screen.getByRole("button", { name: "Descripción" }));
    await userEvent.click(screen.getByRole("button", { name: "Envíos" }));

    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("closes again on a second click", async () => {
    render(<Accordion items={ITEMS} />);

    const header = screen.getByRole("button", { name: "Envíos" });
    await userEvent.click(header);
    await userEvent.click(header);

    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("honours the panels asked to start open", () => {
    render(<Accordion items={ITEMS} defaultOpen={["description"]} />);

    expect(screen.getByRole("region", { name: "Descripción" })).toBeInTheDocument();
    expect(screen.getAllByRole("region")).toHaveLength(1);
  });

  it("operates from the keyboard", async () => {
    render(<Accordion items={ITEMS} />);

    const header = screen.getByRole("button", { name: "Descripción" });
    header.focus();
    await userEvent.keyboard("{Enter}");

    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("gives two accordions on the same page distinct panel ids", () => {
    render(
      <>
        <Accordion items={ITEMS} defaultOpen={["description"]} />
        <Accordion items={ITEMS} defaultOpen={["description"]} />
      </>,
    );

    const [first, second] = screen.getAllByRole("region");
    expect(first?.id).not.toBe(second?.id);
  });

  it("keeps the +/− sign out of the accessible name", () => {
    render(<Accordion items={ITEMS} />);

    expect(screen.getByRole("button", { name: "Descripción" })).toHaveAccessibleName(
      "Descripción",
    );
  });

  it("has no accessibility violations, closed or open", async () => {
    const { container, rerender } = render(<Accordion items={ITEMS} />);
    await expectNoA11yViolations(container);

    rerender(<Accordion items={ITEMS} defaultOpen={["description", "shipping"]} />);
    await expectNoA11yViolations(container);
  });
});

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces itself politely without stealing focus", () => {
    render(<Toast message="Agregado al carrito" onDismiss={vi.fn()} />);

    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Agregado al carrito");
    expect(toast).toHaveAttribute("aria-live", "polite");
    expect(document.activeElement).toBe(document.body);
  });

  it("closes itself at 2200ms, as §03 specifies", () => {
    const onDismiss = vi.fn();
    render(<Toast message="Agregado al carrito" onDismiss={onDismiss} />);

    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    expect(onDismiss).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("cancels the timer when unmounted early", () => {
    const onDismiss = vi.fn();
    const { unmount } = render(<Toast message="Agregado" onDismiss={onDismiss} />);

    unmount();
    vi.advanceTimersByTime(TOAST_DURATION_MS * 2);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("uses the 250ms entrance of §03, not the 280ms overlay one", () => {
    render(<Toast message="Agregado" onDismiss={vi.fn()} />);

    expect(screen.getByRole("status").className).toContain("animate-toast-in");
  });
});
