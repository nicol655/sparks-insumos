import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BoxedInput, BoxedTextArea } from "@/components/primitives/boxed-input";
import { QuantityStepper } from "@/components/primitives/quantity-stepper";
import { Select } from "@/components/primitives/select";
import { TextInput } from "@/components/primitives/text-input";
import { expectNoA11yViolations } from "@/test/a11y";

/** §06: "los formularios con <label> asociado a cada campo". */
describe("TextInput", () => {
  it("associates the label with the field", () => {
    render(<TextInput label="Correo electrónico" />);

    expect(screen.getByLabelText("Correo electrónico")).toBeInstanceOf(HTMLInputElement);
  });

  it("accepts typing", async () => {
    render(<TextInput label="Nombre" />);

    await userEvent.type(screen.getByLabelText("Nombre"), "Nico");

    expect(screen.getByLabelText("Nombre")).toHaveValue("Nico");
  });

  it("marks the error and points the field at the message", () => {
    render(<TextInput label="Correo electrónico" error="Formato inválido" />);

    const field = screen.getByLabelText("Correo electrónico");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Formato inválido");
  });

  it("describes the field with a hint when there is no error", () => {
    render(<TextInput label="Teléfono" hint="Con código de área" />);

    expect(screen.getByLabelText("Teléfono")).toHaveAccessibleDescription("Con código de área");
    expect(screen.getByLabelText("Teléfono")).not.toHaveAttribute("aria-invalid");
  });

  it("carries no aria-invalid and no description when clean", () => {
    render(<TextInput label="Nombre" />);

    const field = screen.getByLabelText("Nombre");
    expect(field).not.toHaveAttribute("aria-invalid");
    expect(field).not.toHaveAttribute("aria-describedby");
  });

  it("uses 16px on mobile so iOS does not zoom the page on focus", () => {
    render(<TextInput label="Nombre" />);

    expect(screen.getByLabelText("Nombre").className).toContain("text-input-mobile");
  });

  it("gives each instance its own ids", () => {
    render(
      <>
        <TextInput label="Nombre" error="Requerido" />
        <TextInput label="Apellido" error="Requerido" />
      </>,
    );

    const [first, second] = screen.getAllByRole("textbox");
    expect(first?.getAttribute("aria-describedby")).not.toBe(
      second?.getAttribute("aria-describedby"),
    );
  });

  it("cannot be typed into when disabled", async () => {
    render(<TextInput label="Nombre" disabled />);

    await userEvent.type(screen.getByLabelText("Nombre"), "Nico");

    expect(screen.getByLabelText("Nombre")).toHaveValue("");
  });

  it("has no accessibility violations, clean or in error", async () => {
    const { container, rerender } = render(<TextInput label="Correo electrónico" />);
    await expectNoA11yViolations(container);

    rerender(<TextInput label="Correo electrónico" error="Formato inválido" />);
    await expectNoA11yViolations(container);
  });
});

/** §03 · the boxed variant, used by the coupon field and the contact textarea. */
describe("BoxedInput", () => {
  it("associates its label", () => {
    render(<BoxedInput label="Cupón" />);

    expect(screen.getByLabelText("Cupón")).toBeInTheDocument();
  });

  it("announces coupon feedback politely", () => {
    render(<BoxedInput label="Cupón" status="success" message="Cupón aplicado · −10%" />);

    expect(screen.getByRole("status")).toHaveTextContent("Cupón aplicado · −10%");
    expect(screen.getByLabelText("Cupón")).toHaveAccessibleDescription("Cupón aplicado · −10%");
  });

  it("leaves the border alone on an invalid coupon, as §03 asks", () => {
    render(<BoxedInput label="Cupón" status="error" message="Cupón inválido" />);

    const field = screen.getByLabelText("Cupón");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field.className).not.toContain("border-danger");
  });

  it("colours the message by status", () => {
    const { rerender } = render(<BoxedInput label="Cupón" status="success" message="Aplicado" />);
    expect(screen.getByRole("status").className).toContain("text-success");

    rerender(<BoxedInput label="Cupón" status="error" message="Inválido" />);
    expect(screen.getByRole("status").className).toContain("text-danger");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <BoxedInput label="Cupón" status="error" message="Cupón inválido" />,
    );

    await expectNoA11yViolations(container);
  });
});

describe("BoxedTextArea", () => {
  it("associates its label and resizes vertically only", () => {
    render(<BoxedTextArea label="Mensaje" />);

    const field = screen.getByLabelText("Mensaje");
    expect(field).toBeInstanceOf(HTMLTextAreaElement);
    expect(field.className).toContain("resize-y");
  });

  it("marks and describes an error", () => {
    render(<BoxedTextArea label="Mensaje" error="Contanos algo" />);

    const field = screen.getByLabelText("Mensaje");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Contanos algo");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<BoxedTextArea label="Mensaje" />);

    await expectNoA11yViolations(container);
  });
});

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "price-asc", label: "Precio: menor a mayor" },
];

describe("Select", () => {
  it("associates its label and lists the options", () => {
    render(<Select label="Ordenar" options={SORT_OPTIONS} defaultValue="relevance" />);

    expect(screen.getByLabelText("Ordenar")).toBeInstanceOf(HTMLSelectElement);
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("reports the chosen value", async () => {
    const onChange = vi.fn();
    render(
      <Select
        label="Ordenar"
        options={SORT_OPTIONS}
        defaultValue="relevance"
        onChange={onChange}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Ordenar"), "price-asc");

    expect(screen.getByLabelText("Ordenar")).toHaveValue("price-asc");
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("hides the decorative chevron", () => {
    const { container } = render(<Select label="Ordenar" options={SORT_OPTIONS} />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Select label="Ordenar" options={SORT_OPTIONS} />);

    await expectNoA11yViolations(container);
  });
});

/** §03 · minimum is 1; the row's ✕ is what removes a line. */
describe("QuantityStepper", () => {
  const labels = {
    decreaseLabel: "Disminuir cantidad",
    increaseLabel: "Aumentar cantidad",
    valueLabel: "Cantidad",
  };

  it("shows the current quantity", () => {
    render(<QuantityStepper value={3} max={7} onChange={vi.fn()} {...labels} />);

    expect(screen.getByLabelText("Cantidad")).toHaveTextContent("3");
  });

  it("steps up and down", async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={3} max={7} onChange={onChange} {...labels} />);

    await userEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    expect(onChange).toHaveBeenLastCalledWith(4);

    await userEvent.click(screen.getByRole("button", { name: "Disminuir cantidad" }));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("disables − at one instead of removing the line", async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={1} max={7} onChange={onChange} {...labels} />);

    const decrease = screen.getByRole("button", { name: "Disminuir cantidad" });
    expect(decrease).toBeDisabled();

    await userEvent.click(decrease);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables + at the stock ceiling", async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={7} max={7} onChange={onChange} {...labels} />);

    const increase = screen.getByRole("button", { name: "Aumentar cantidad" });
    expect(increase).toBeDisabled();

    await userEvent.click(increase);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("announces the quantity politely", () => {
    render(<QuantityStepper value={2} max={7} onChange={vi.fn()} {...labels} />);

    expect(screen.getByLabelText("Cantidad")).toHaveAttribute("aria-live", "polite");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <QuantityStepper value={1} max={7} onChange={vi.fn()} {...labels} />,
    );

    await expectNoA11yViolations(container);
  });
});
