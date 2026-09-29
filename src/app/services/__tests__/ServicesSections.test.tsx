import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import WhyMe from "../WhyMe";
import ConsultationSection from "../ConsultationSection";
import { DEFAULT_CONSULTATION } from "@/lib/consultation";
import { DEFAULT_SERVICES_PAGE } from "@/lib/services";

vi.mock("../../contact/ContactProvider", () => ({ useContact: () => ({ open: vi.fn() }) }));

describe("Services page sections", () => {
  it("lists the reasons to work with me", () => {
    render(<WhyMe title="Why work with me" points={DEFAULT_SERVICES_PAGE.whyPoints!} />);
    const section = screen.getByRole("region", { name: "Why work with me" });
    expect(within(section).getAllByRole("listitem")).toHaveLength(4);
    expect(within(section).getByRole("heading", { level: 3, name: "Engineering leader, still hands-on" })).toBeInTheDocument();
  });

  it("shows nothing when there are no reasons", () => {
    const { container } = render(<WhyMe title="Why" points={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers the free consultation with its own heading and booking button", () => {
    render(<ConsultationSection consultation={{ ...DEFAULT_CONSULTATION, bookingUrl: "https://cal.com/esteban/30min" }} />);
    const section = screen.getByRole("region", { name: "Free 30-Minute Technical Consultation" });
    expect(section).toHaveTextContent(/No sales pitch/);
    expect(within(section).getByRole("link", { name: "Book a Free Consultation" })).toHaveAttribute("href", "https://cal.com/esteban/30min");
  });
});
