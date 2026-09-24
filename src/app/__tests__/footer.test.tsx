import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "../footer";

describe("Footer", () => {
  it("shows the copyright with the current year", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${currentYear} Esteban Payret`))
    ).toBeInTheDocument();
  });
});
