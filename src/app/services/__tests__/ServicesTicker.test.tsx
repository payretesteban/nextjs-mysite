import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import ServicesTicker from "../ServicesTicker";

const NAMES = ["Custom Software Development", "Web Development", "AI workflows"];
const visibleName = (container: HTMLElement) =>
  [...container.querySelectorAll(".animate-ticker")].map((el) => el.textContent);

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduce && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
}

describe("ServicesTicker", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("links to the Services page and gives screen readers the full list", () => {
    mockReducedMotion(false);
    render(<ServicesTicker names={NAMES} />);
    expect(screen.getByRole("link", { name: /see all services/i })).toHaveAttribute("href", "/services");
    expect(screen.getByText("including Custom Software Development, Web Development, AI workflows")).toBeInTheDocument();
  });

  it("rotates through the names, pausing while hovered", () => {
    vi.useFakeTimers();
    mockReducedMotion(false);
    const { container } = render(<ServicesTicker names={NAMES} />);
    expect(visibleName(container)).toEqual(["Custom Software Development"]);

    act(() => vi.advanceTimersByTime(2500));
    expect(visibleName(container)).toEqual(["Web Development"]);

    fireEvent.mouseEnter(container.firstElementChild!);
    act(() => vi.advanceTimersByTime(10_000));
    expect(visibleName(container)).toEqual(["Web Development"]);

    fireEvent.mouseLeave(container.firstElementChild!);
    act(() => vi.advanceTimersByTime(2500));
    expect(visibleName(container)).toEqual(["AI workflows"]);
  });

  it("keeps every name in the layout so the width never changes", () => {
    mockReducedMotion(false);
    const { container } = render(<ServicesTicker names={NAMES} />);
    // All names are rendered in the same grid cell; only one is visible
    expect(container.querySelectorAll("[class*='grid-area']")).toHaveLength(3);
    expect(container.querySelectorAll(".invisible")).toHaveLength(2);
  });

  it("stays still for visitors who prefer reduced motion", () => {
    vi.useFakeTimers();
    mockReducedMotion(true);
    const { container } = render(<ServicesTicker names={NAMES} />);
    act(() => vi.advanceTimersByTime(10_000));
    expect(visibleName(container)).toEqual(["Custom Software Development"]);
  });
});
