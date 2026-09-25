import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Footer from "../footer";
import pkg from "../../../package.json";

const open = vi.fn();
vi.mock("../contact/ContactProvider", () => ({ useContact: () => ({ open }) }));

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

  it("links to LinkedIn and GitHub from the Sanity links, opening in a new tab", () => {
    render(
      <Footer
        links={[
          { _id: "1", title: "LinkedIn", url: "https://www.linkedin.com/in/someone/" },
          { _id: "2", title: "GitHub", url: "https://github.com/someone" },
        ]}
      />
    );
    const linkedin = screen.getByRole("link", { name: /linkedin/i });
    expect(linkedin).toHaveAttribute("href", "https://www.linkedin.com/in/someone/");
    expect(linkedin).toHaveAttribute("target", "_blank");
    expect(linkedin).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("href", "https://github.com/someone");
  });

  it("falls back to the default profiles when Sanity has no such links", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute("href", expect.stringContaining("linkedin.com"));
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("href", expect.stringContaining("github.com"));
  });

  it("opens the contact form instead of an email link", () => {
    render(<Footer />);
    expect(screen.queryByRole("link", { name: /mail|message/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /send me a message/i }));
    expect(open).toHaveBeenCalled();
  });
});
