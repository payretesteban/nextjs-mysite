import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import BookButton from "../BookButton";

const open = vi.fn();
vi.mock("../../contact/ContactProvider", () => ({ useContact: () => ({ open }) }));

describe("Book a Free Consultation button", () => {
  afterEach(() => {
    open.mockClear();
    delete window.Cal;
    document.head.querySelectorAll("script[src*='cal.com']").forEach((s) => s.remove());
    vi.restoreAllMocks();
  });

  it("opens the Cal.com booking calendar as a popup, loading Cal.com only on click", () => {
    render(<BookButton bookingUrl="https://cal.com/esteban/30min" label="Book a Free Consultation" />);
    const link = screen.getByRole("link", { name: "Book a Free Consultation" });
    expect(link).toHaveAttribute("href", "https://cal.com/esteban/30min");
    expect(document.querySelector("script[src*='cal.com']")).toBeNull();

    fireEvent.click(link);
    expect(document.querySelector("script[src='https://app.cal.com/embed/embed.js']")).not.toBeNull();
    expect(window.Cal?.q).toEqual([
      ["init", { origin: "https://cal.com" }],
      ["modal", { calLink: "esteban/30min", config: { layout: "month_view", theme: "light" } }],
    ]);
  });

  it("opens other scheduling tools in a new tab", () => {
    const tab = { opener: {} };
    const windowOpen = vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    render(<BookButton bookingUrl="https://calendly.com/esteban/30min" label="Book" />);
    fireEvent.click(screen.getByRole("link", { name: "Book" }));
    expect(windowOpen).toHaveBeenCalledWith("https://calendly.com/esteban/30min", "_blank");
    expect(tab.opener).toBeNull();
  });

  it("opens the contact form for a consultation when there's no booking link yet", () => {
    render(<BookButton bookingUrl={null} label="Book" />);
    fireEvent.click(screen.getByRole("link", { name: "Book" }));
    expect(open).toHaveBeenCalledWith("consulting", "Free 30-minute consultation");
  });

  it("leaves Cmd/Ctrl-click to the browser", () => {
    render(<BookButton bookingUrl="https://cal.com/esteban/30min" label="Book" />);
    fireEvent.click(screen.getByRole("link", { name: "Book" }), { metaKey: true });
    expect(window.Cal).toBeUndefined();
  });
});
