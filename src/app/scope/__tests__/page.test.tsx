import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ScopePage, { metadata } from "../page";

vi.mock("@/lib/animations", () => ({ Animated: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/consultation", () => ({ getConsultation: vi.fn(async () => ({ bookingUrl: "https://cal.com/me/30min", buttonLabel: "Book a call" })) }));
vi.mock("../ScopeWizard", () => ({
  default: ({ bookingUrl, bookLabel }: { bookingUrl: string; bookLabel: string }) => <p>Wizard: {bookLabel} → {bookingUrl}</p>,
}));

describe("Project scoping page", () => {
  it("shows the title and passes the booking link to the wizard", async () => {
    render(await ScopePage());
    expect(screen.getByRole("heading", { level: 1, name: "Project Scoping Assistant" })).toBeInTheDocument();
    expect(screen.getByText("Wizard: Book a call → https://cal.com/me/30min")).toBeInTheDocument();
    expect(metadata.title).toBe("Project Scoping Assistant");
  });
});
