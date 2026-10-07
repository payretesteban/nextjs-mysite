import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import AiCostCasePage, { metadata } from "../page";

vi.mock("@/app/context/AnimationContext", () => ({ useAnimation: () => ({ reducedMotion: true, animationClass: "" }) }));
vi.mock("@/lib/consultation", () => ({ getConsultation: vi.fn(async () => ({ bookingUrl: "https://cal.com/me/30min", buttonLabel: "Book a Free Consultation" })) }));
vi.mock("../../consultation/BookButton", () => ({
  default: ({ label, bookingUrl, notes }: { label: string; bookingUrl: string; notes: string }) => (
    <a href={bookingUrl} data-notes={notes}>
      {label}
    </a>
  ),
}));

describe("AI cost case page", () => {
  it("introduces the fictional company under the AI cost case label", async () => {
    render(await AiCostCasePage());
    expect(screen.getByText("Lab · AI cost case")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Same results, a fraction of the AI bill" })).toBeInTheDocument();
    expect(screen.getByText(/Fictional company/)).toBeInTheDocument();
    expect(metadata.title).toMatch(/^AI Cost Case/);
  });

  it("has the six numbered sections in order", async () => {
    render(await AiCostCasePage());
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, 6)).toEqual([
      "01The company",
      "02Where the money went",
      "03The redesign",
      "04What changed, box by box",
      "05A sample weekly report",
      "06Try your numbers",
    ]);
    expect(within(screen.getByRole("list", { name: "Tools" })).getAllByRole("listitem")).toHaveLength(5);
  });

  it("lists the assumptions behind the numbers", async () => {
    render(await AiCostCasePage());
    expect(screen.getByText("Assumptions behind the numbers")).toBeInTheDocument();
    expect(screen.getByText("$5 in / $25 out per million tokens")).toBeInTheDocument();
    expect(screen.getByText("10% and 50% of the normal price")).toBeInTheDocument();
  });

  it("ends with a booking button that explains where the visitor came from, and a link to scoping", async () => {
    render(await AiCostCasePage());
    const book = screen.getByRole("link", { name: "Book a Free Consultation" });
    expect(book).toHaveAttribute("href", "https://cal.com/me/30min");
    expect(book.dataset.notes).toMatch(/^From the AI cost case/);
    expect(screen.getByRole("link", { name: /scope a project first/ })).toHaveAttribute("href", "/scope");
  });

  it("shows no moving data or pause button for visitors who prefer less motion", async () => {
    const { container } = render(await AiCostCasePage());
    expect(container.querySelector("animateMotion")).toBeNull();
    expect(screen.queryByRole("button", { name: /Pause the data/ })).not.toBeInTheDocument();
  });
});
