import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import LabStrip, { AUTOPLAY_MS } from "../LabStrip";

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

  describe("moving on by itself", () => {
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    /** Four cards with two pages, on page 1 (or 2), and a recorder for where it scrolls to. */
    function setup(scrollLeft = 0) {
      vi.useFakeTimers();
      render(
        <LabStrip label="Experiments">
          {["A", "B", "C", "D"].map((x) => (
            <a key={x} href={`/${x}`}>
              {x}
            </a>
          ))}
        </LabStrip>
      );
      const list = screen.getByRole("list", { name: "Experiments" });
      const scrollTo = vi.fn();
      list.scrollTo = scrollTo as unknown as typeof list.scrollTo;
      fakeLayout(list, 736, scrollLeft);
      fireEvent.scroll(list);
      return { list, scrollTo, strip: list.parentElement as HTMLElement };
    }
    const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

    it("moves to the next page every few seconds, then back to the start", () => {
      const { scrollTo } = setup();
      wait(AUTOPLAY_MS - 100);
      expect(scrollTo).not.toHaveBeenCalled();
      wait(100);
      expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 260 }));
      expect(screen.getByTestId("page-progress")).toHaveClass("animate-lab-progress");
    });

    it("goes back to the first page after the last one", () => {
      const { scrollTo } = setup(260);
      wait(AUTOPLAY_MS);
      expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 0 }));
    });

    it("waits while the mouse is over it, and carries on when it leaves", () => {
      const { scrollTo, strip } = setup();
      fireEvent.mouseEnter(strip);
      wait(AUTOPLAY_MS * 2);
      expect(scrollTo).not.toHaveBeenCalled();
      expect(screen.getByTestId("page-progress")).not.toHaveClass("animate-lab-progress");
      fireEvent.mouseLeave(strip);
      wait(AUTOPLAY_MS);
      expect(scrollTo).toHaveBeenCalledTimes(1);
    });

    it("waits while keyboard focus is inside it", () => {
      const { scrollTo } = setup();
      fireEvent.focus(screen.getByRole("link", { name: "A" }));
      wait(AUTOPLAY_MS * 2);
      expect(scrollTo).not.toHaveBeenCalled();
      fireEvent.blur(screen.getByRole("link", { name: "A" }), { relatedTarget: document.body });
      wait(AUTOPLAY_MS);
      expect(scrollTo).toHaveBeenCalledTimes(1);
    });

    it("waits a while after a swipe on a touch screen", () => {
      const { scrollTo, list } = setup();
      fireEvent.pointerDown(list, { pointerType: "touch" });
      wait(AUTOPLAY_MS);
      expect(scrollTo).not.toHaveBeenCalled();
      wait(8000 - AUTOPLAY_MS); // the hold ends 8 s after the touch
      expect(scrollTo).not.toHaveBeenCalled();
      wait(AUTOPLAY_MS);
      expect(scrollTo).toHaveBeenCalledTimes(1);
    });

    it("stops for good with the pause button, and starts again with play", () => {
      const { scrollTo } = setup();
      fireEvent.click(screen.getByRole("button", { name: "Pause the slideshow" }));
      fireEvent.blur(screen.getByRole("button", { name: "Play the slideshow" }), { relatedTarget: document.body });
      wait(AUTOPLAY_MS * 3);
      expect(scrollTo).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Play the slideshow" }));
      fireEvent.blur(screen.getByRole("button", { name: "Pause the slideshow" }), { relatedTarget: document.body });
      wait(AUTOPLAY_MS);
      expect(scrollTo).toHaveBeenCalledTimes(1);
    });

    it("waits while the tab is in the background", () => {
      const { scrollTo } = setup();
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      wait(AUTOPLAY_MS * 2);
      expect(scrollTo).not.toHaveBeenCalled();
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      wait(AUTOPLAY_MS);
      expect(scrollTo).toHaveBeenCalledTimes(1);
    });

    it("never moves, and has no pause button, for visitors who prefer less motion", () => {
      vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
      const { scrollTo } = setup();
      wait(AUTOPLAY_MS * 3);
      expect(scrollTo).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: /slideshow/ })).not.toBeInTheDocument();
    });
  });
});
