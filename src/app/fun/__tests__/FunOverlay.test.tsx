import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FunOverlay from "../FunOverlay";

describe("Fun mode canvas", () => {
  it("covers the page without blocking clicks and stays hidden from screen readers", () => {
    render(<FunOverlay effect="confetti" calm={false} />);
    const canvas = screen.getByTestId("fun-overlay");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas.className).toMatch(/pointer-events-none/);
    expect(canvas.className).toMatch(/fixed inset-0/);
  });
});
