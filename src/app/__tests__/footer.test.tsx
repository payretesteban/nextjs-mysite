import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "../footer";
import pkg from "../../../package.json";

describe("Footer", () => {
  it("shows the copyright with the current year", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${currentYear} Esteban Payret`))
    ).toBeInTheDocument();
  });

  it("shows the site version from package.json", () => {
    render(<Footer />);
    expect(screen.getByText(`v${pkg.version}`)).toBeInTheDocument();
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
