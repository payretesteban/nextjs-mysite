import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LabStrip from "../LabStrip";

/** Gives the list and its cards the sizes a browser would lay out (jsdom has no layout). */
function fakeLayout(list: HTMLElement, clientWidth: number, scrollLeft: number) {
  Object.defineProperty(list, "clientWidth", { configurable: true, value: clientWidth });
  Object.defineProperty(list, "scrollWidth", { configurable: true, value: 996 });
  Object.defineProperty(list, "scrollLeft", { configurable: true, writable: true, value: scrollLeft });
  for (const li of Array.from(list.children)) Object.defineProperty(li, "offsetWidth", { configurable: true, value: 232 });
}

describe("The Lab swipe strip", () => {
  it("shows every card in a labelled list", () => {
    render(
      <LabStrip label="Experiments">
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </LabStrip>
    );
    expect(screen.getByRole("list", { name: "Experiments" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("shows one step per page of cards, not one per card, and scrolls with the arrows", () => {
    render(
      <LabStrip label="Experiments">
        {["A", "B", "C", "D"].map((x) => (
          <span key={x}>{x}</span>
        ))}
      </LabStrip>
    );
    const list = screen.getByRole("list", { name: "Experiments" });
    const scrollTo = vi.fn();
    list.scrollTo = scrollTo as unknown as typeof list.scrollTo;

    // 4 cards of 232px + 12px gaps + 16px padding each side in a 736px-wide row: 3 fit, so 2 pages
    fakeLayout(list, 736, 0);
    fireEvent.scroll(list);
    expect(screen.getAllByRole("button", { name: /^Page \d of 2$/ })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Page 1 of 2" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Previous experiments" })).toBeDisabled();

    // The next arrow goes straight to the end instead of leaving a 16px sliver for a third step
    fireEvent.click(screen.getByRole("button", { name: "More experiments" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 260 }));

    fakeLayout(list, 736, 260);
    fireEvent.scroll(list);
    expect(screen.getByRole("button", { name: "Page 2 of 2" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "More experiments" })).toBeDisabled();

    // Clicking a page jumps there
    fireEvent.click(screen.getByRole("button", { name: "Page 1 of 2" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 0 }));
  });

  it("has more pages on a narrow screen, and none when everything fits", () => {
    render(
      <LabStrip label="Experiments">
        {["A", "B", "C", "D"].map((x) => (
          <span key={x}>{x}</span>
        ))}
      </LabStrip>
    );
    const list = screen.getByRole("list", { name: "Experiments" });
    fakeLayout(list, 358, 0); // phone: about one and a half cards visible
    fireEvent.scroll(list);
    expect(screen.getAllByRole("button", { name: /^Page \d of 4$/ })).toHaveLength(4);

    fakeLayout(list, 996, 0); // wide enough for every card
    fireEvent.scroll(list);
    expect(screen.queryByRole("button", { name: /^Page/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "More experiments" })).not.toBeInTheDocument();
  });
});
