import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import SiteLogNotes from "../SiteLogNotes";

const entries = [
  { _id: "a", title: "The Genesis", text: "It all began." },
  { _id: "b", title: "The Animation Tax", text: "Buttons doing cardio." },
  { _id: "c", title: "The Miracle", text: "Stared at the code." },
  { _id: "d", title: "Typography", text: "Fancy text." },
];

const topTitle = () => screen.getByRole("heading", { level: 3 }).textContent;

describe("SiteLogNotes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the first note on top, numbered, with a counter and a link to the full log", () => {
    render(<SiteLogNotes entries={entries} moreHref="/site-log" />);
    // Only the top note is exposed to assistive tech
    expect(topTitle()).toBe("The Genesis");
    expect(screen.getByText("#01")).toBeInTheDocument();
    expect(screen.getByText("01 / 04")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read the full log/i })).toHaveAttribute("href", "/site-log");
  });

  it("tosses the top note to the back when 'Next note' is pressed, and wraps around", () => {
    render(<SiteLogNotes entries={entries} />);
    for (const expected of ["The Animation Tax", "The Miracle", "Typography", "The Genesis"]) {
      fireEvent.click(screen.getByRole("button", { name: /next note/i }));
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(topTitle()).toBe(expected);
    }
    expect(screen.getByText(/note 1 of 4: the genesis/i)).toBeInTheDocument();
  });

  it("advances once per click even when clicked quickly", () => {
    render(<SiteLogNotes entries={entries} />);
    const button = screen.getByRole("button", { name: /next note/i });
    fireEvent.click(button);
    fireEvent.click(button);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(topTitle()).toBe("The Animation Tax");
  });

  it("advances on a swipe", () => {
    const { container } = render(<SiteLogNotes entries={entries} />);
    const pile = container.querySelector("article")!.parentElement!;
    fireEvent.pointerDown(pile, { clientX: 200 });
    fireEvent.pointerUp(pile, { clientX: 100 });
    fireEvent.click(pile); // the browser's click after a swipe is ignored
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(topTitle()).toBe("The Animation Tax");
  });

  it("renders nothing without entries and no button for a single note", () => {
    const { container, rerender } = render(<SiteLogNotes entries={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<SiteLogNotes entries={[entries[0]]} />);
    expect(screen.queryByRole("button", { name: /next note/i })).not.toBeInTheDocument();
  });
});
