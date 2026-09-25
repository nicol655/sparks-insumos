import { describe, expect, it } from "vitest";

import { GoldRule } from "@/components/primitives/gold-rule";
import { renderWithIntl } from "@/test/i18n";

describe("GoldRule", () => {
  it("is a 34×1 gold dash, hidden from AT", () => {
    const { container } = renderWithIntl(<GoldRule />);
    const rule = container.querySelector("[data-gold-rule]");

    expect(rule).toHaveAttribute("aria-hidden", "true");
    expect(rule).toHaveClass("bg-accent-gold", "h-px", "w-[34px]");
  });
});
