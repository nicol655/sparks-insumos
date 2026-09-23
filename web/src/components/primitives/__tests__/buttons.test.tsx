import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ButtonPrimary } from "@/components/primitives/button-primary";
import { ButtonSecondary } from "@/components/primitives/button-secondary";
import { ButtonTertiary } from "@/components/primitives/button-tertiary";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * §03 · the three buttons share a contract, so they share a suite. Pixel
 * values (padding, 48px touch target, hover colour) are CSS and are checked
 * against a real engine in the Playwright phase; what a unit test can hold
 * onto is behaviour and semantics.
 */
const VARIANTS = [
  ["primary", ButtonPrimary],
  ["secondary", ButtonSecondary],
  ["tertiary", ButtonTertiary],
] as const;

describe.each(VARIANTS)("Button%s", (_name, Button) => {
  it("renders its label as a button", () => {
    render(<Button>Agregar al carrito</Button>);

    expect(screen.getByRole("button", { name: "Agregar al carrito" })).toBeInTheDocument();
  });

  it("does not submit a form unless asked to", () => {
    render(<Button>Agregar</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("can be a submit button", () => {
    render(<Button type="submit">Pagar</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("calls the handler on click and on Enter", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Agregar</Button>);

    const button = screen.getByRole("button");

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();

    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("ignores clicks while disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Agregar
      </Button>,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  describe("loading", () => {
    it("shows the process label and hides the idle one", () => {
      render(
        <Button loading loadingLabel="Procesando…">
          Agregar
        </Button>,
      );

      expect(screen.getByRole("button")).toHaveAccessibleName("Procesando…");
    });

    it("keeps the idle label in flow so the width does not jump", () => {
      const { container } = render(
        <Button loading loadingLabel="Procesando…">
          Agregar
        </Button>,
      );

      const idle = container.querySelector('[aria-hidden="true"]');
      expect(idle).toHaveTextContent("Agregar");
      expect(idle).toHaveClass("invisible");
    });

    it("is inert and announces itself as busy", async () => {
      const onClick = vi.fn();
      render(
        <Button loading loadingLabel="Procesando…" onClick={onClick}>
          Agregar
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");

      await userEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("carries no aria-busy when idle", () => {
      render(<Button>Agregar</Button>);

      expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy");
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Button>Agregar al carrito</Button>);

    await expectNoA11yViolations(container);
  });

  it("has no accessibility violations while loading", async () => {
    const { container } = render(
      <Button loading loadingLabel="Procesando…">
        Agregar al carrito
      </Button>,
    );

    await expectNoA11yViolations(container);
  });
});

describe("ButtonSecondary on ink", () => {
  it("switches to the inverted palette and its focus outline", () => {
    render(<ButtonSecondary onInk>Consultar</ButtonSecondary>);

    const className = screen.getByRole("button").className;
    expect(className).toContain("text-canvas");
    expect(className).toContain("focus-visible:outline-canvas");
  });
});

describe("ButtonPrimary compact", () => {
  it("uses the dense padding of §03", () => {
    render(<ButtonPrimary compact>Ver</ButtonPrimary>);

    expect(screen.getByRole("button").className).toContain("py-[15px]");
  });
});
