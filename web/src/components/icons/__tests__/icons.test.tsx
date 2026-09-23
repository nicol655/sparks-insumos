import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ChevronDownIcon,
  MenuGlyph,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  UserIcon,
  WhatsappDot,
  XIcon,
} from "@/components/icons";

/**
 * §05 fixes the whole icon set and the rules it must obey. These assertions are
 * that section, executable: if someone adds a filled icon or a fixed width,
 * the suite fails.
 */

const STROKE_ICONS = [
  ["search", SearchIcon],
  ["shopping-bag", ShoppingBagIcon],
  ["user", UserIcon],
  ["x", XIcon],
  ["chevron-down", ChevronDownIcon],
  ["plus", PlusIcon],
  ["minus", MinusIcon],
] as const;

describe.each(STROKE_ICONS)("%s", (_name, IconComponent) => {
  it("is a stroke SVG on the 24px grid", () => {
    const { container } = render(<IconComponent />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("fill", "none");
  });

  it("takes its size from the class, never from width/height", () => {
    const { container } = render(<IconComponent />);
    const svg = container.querySelector("svg");

    expect(svg).not.toHaveAttribute("width");
    expect(svg).not.toHaveAttribute("height");
    expect(svg?.getAttribute("class")).toMatch(/h-|w-/);
  });

  it("lets the call site override the size", () => {
    const { container } = render(<IconComponent className="h-10 w-10" />);

    expect(container.querySelector("svg")).toHaveAttribute("class", "h-10 w-10");
  });

  it("is decorative, so the control that holds it provides the name", () => {
    const { container } = render(<IconComponent />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no solid fill on any path", () => {
    const { container } = render(<IconComponent />);

    for (const shape of container.querySelectorAll("path, circle")) {
      expect(shape).not.toHaveAttribute("fill");
    }
  });
});

/**
 * §05 · "whatsapp · Único ícono de marca permitido. Usar el logotipo oficial
 * monocromo, nunca redibujado; el punto success de 8px puede sustituirlo."
 */
describe("WhatsappDot", () => {
  it("is the 8px success dot the document allows instead of the logo", () => {
    const { container } = render(<WhatsappDot />);
    const dot = container.firstElementChild;

    expect(dot?.className).toContain("bg-success");
    expect(dot?.className).toContain("rounded-full");
    expect(dot?.className).toContain("h-2");
  });

  it("is decorative", () => {
    const { container } = render(<WhatsappDot />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});

/** §03 · the prototype draws the hamburger with three 1px rules, not an SVG. */
describe("MenuGlyph", () => {
  it("is three hairlines", () => {
    const { container } = render(<MenuGlyph />);
    const rules = container.querySelectorAll("span > span");

    expect(rules).toHaveLength(3);
    for (const rule of rules) {
      expect(rule.className).toContain("h-px");
    }
  });

  it("is decorative", () => {
    const { container } = render(<MenuGlyph />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
