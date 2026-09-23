import { useRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useFocusTrap } from "@/lib/ui/overlay";

function Trap({ onEscape }: { onEscape: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, { active: true, onEscape });

  return (
    <div ref={ref}>
      <button type="button">First</button>
      <button type="button">Last</button>
    </div>
  );
}

describe("useFocusTrap", () => {
  it("focuses the first stop on mount", () => {
    render(<Trap onEscape={() => undefined} />);

    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("wraps Tab from the last stop back to the first", async () => {
    render(<Trap onEscape={() => undefined} />);

    screen.getByRole("button", { name: "Last" }).focus();
    await userEvent.tab();

    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("calls onEscape on Escape", async () => {
    const onEscape = vi.fn();
    render(<Trap onEscape={onEscape} />);

    await userEvent.keyboard("{Escape}");

    expect(onEscape).toHaveBeenCalledOnce();
  });
});
