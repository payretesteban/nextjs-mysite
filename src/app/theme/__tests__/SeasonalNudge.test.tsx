import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import SeasonalNudge from "../SeasonalNudge";
import ThemeDecorations from "../ThemeDecorations";
import { setTheme } from "../useTheme";

const root = document.documentElement;

describe("Seasonal theme invitation", () => {
  beforeEach(() => {
    localStorage.clear();
    delete root.dataset.theme;
    delete root.dataset.mode;
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  });
  afterEach(() => vi.useRealTimers());

  it("invites visitors to try Halloween in season, a few seconds after the page loads", () => {
    vi.setSystemTime(new Date(2026, 9, 20, 12));
    render(<SeasonalNudge />);
    expect(screen.queryByRole("region", { name: "Seasonal theme" })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("region", { name: "Seasonal theme" })).toHaveTextContent("It's spooky season. Try the Halloween theme?");
    fireEvent.click(screen.getByRole("button", { name: "Try it" }));
    expect(root.dataset.theme).toBe("halloween");
    expect(localStorage.getItem("ep-theme-nudge:halloween-2026")).toBe("accepted");
    expect(screen.queryByRole("region", { name: "Seasonal theme" })).not.toBeInTheDocument();
  });

  it("also invites visitors on the Circuit theme", () => {
    vi.setSystemTime(new Date(2026, 9, 20, 12));
    act(() => setTheme("circuit"));
    render(<SeasonalNudge />);
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("region", { name: "Seasonal theme" })).toBeInTheDocument();
  });

  it("asks only once a season", () => {
    vi.setSystemTime(new Date(2026, 9, 20, 12));
    const { unmount } = render(<SeasonalNudge />);
    act(() => vi.advanceTimersByTime(4000));
    fireEvent.click(screen.getByRole("button", { name: "No thanks" }));
    expect(root.dataset.theme).toBeUndefined();
    unmount();
    render(<SeasonalNudge />);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.queryByRole("region", { name: "Seasonal theme" })).not.toBeInTheDocument();
  });

  it("stays away before October 15 (even though Halloween is already in the picker), out of season, or when another theme is on", () => {
    vi.setSystemTime(new Date(2026, 9, 14, 12));
    const early = render(<SeasonalNudge />);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.queryByRole("region", { name: "Seasonal theme" })).not.toBeInTheDocument();
    early.unmount();

    vi.setSystemTime(new Date(2026, 5, 1, 12));
    const { unmount } = render(<SeasonalNudge />);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.queryByRole("region", { name: "Seasonal theme" })).not.toBeInTheDocument();
    unmount();

    vi.setSystemTime(new Date(2026, 9, 20, 12));
    act(() => setTheme("retro"));
    render(<SeasonalNudge />);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.queryByRole("region", { name: "Seasonal theme" })).not.toBeInTheDocument();
  });
});

describe("Theme decorations", () => {
  it("draws the business card's circuit traces in the Circuit theme", () => {
    act(() => setTheme("circuit"));
    const { container } = render(<ThemeDecorations />);
    expect(container.querySelector("[data-testid=theme-decorations]")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".theme-circuit-pulse")).toHaveLength(5);
    act(() => setTheme("clean"));
  });

  beforeEach(() => {
    delete root.dataset.theme;
  });

  it("adds flapping bats, a skeleton and pumpkins in the Halloween theme only, hidden from screen readers", () => {
    const { container } = render(<ThemeDecorations />);
    expect(container).toBeEmptyDOMElement();
    act(() => setTheme("halloween"));
    const layer = container.firstElementChild!;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.querySelectorAll(".theme-bat")).toHaveLength(3);
    expect(layer.querySelectorAll(".theme-bat-wing")).toHaveLength(6); // two flapping wings per bat
    expect(layer.querySelectorAll(".theme-pumpkin")).toHaveLength(2);
    expect(layer.querySelectorAll(".theme-skeleton")).toHaveLength(1);
    act(() => setTheme("clean"));
    expect(container).toBeEmptyDOMElement();
  });
});
