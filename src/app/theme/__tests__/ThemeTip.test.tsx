import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ThemePicker from "../ThemePicker";
import { setTheme } from "../useTheme";

const root = document.documentElement;
const tip = () => screen.queryByRole("note");

describe("Try-the-themes tip", () => {
  beforeEach(() => {
    localStorage.clear();
    delete root.dataset.theme;
    delete root.dataset.mode;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 10)); // June: no seasonal invitation
  });
  afterEach(() => vi.useRealTimers());

  it("appears under the 🎨 button a moment after the page loads", () => {
    render(<ThemePicker />);
    expect(tip()).toBeNull();
    act(() => vi.advanceTimersByTime(2500));
    expect(tip()).toHaveTextContent("Try the site themes");
  });

  it("goes away for good once the visitor opens the themes (from the tip or the button)", () => {
    const { unmount } = render(<ThemePicker />);
    act(() => vi.advanceTimersByTime(2500));
    fireEvent.click(screen.getByRole("button", { name: /Try the site themes/ }));
    expect(screen.getByRole("dialog", { name: "Theme and colours" })).toBeInTheDocument();
    expect(tip()).toBeNull();
    expect(localStorage.getItem("ep-theme-tip")).toBe("done");
    unmount();
    render(<ThemePicker />);
    act(() => vi.advanceTimersByTime(20000));
    expect(tip()).toBeNull();
  });

  it("can be dismissed with ✕, and doesn't come back", () => {
    render(<ThemePicker />);
    act(() => vi.advanceTimersByTime(2500));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss the theme tip" }));
    expect(tip()).toBeNull();
    expect(localStorage.getItem("ep-theme-tip")).toBe("done");
  });

  it("counts picking a theme anywhere else (like the ⌘K menu) as trying them", () => {
    render(<ThemePicker />);
    act(() => vi.advanceTimersByTime(2500));
    act(() => setTheme("retro"));
    expect(tip()).toBeNull();
    expect(localStorage.getItem("ep-theme-tip")).toBe("done");
  });

  it("hides by itself after a while if ignored, and may show again next visit", () => {
    render(<ThemePicker />);
    act(() => vi.advanceTimersByTime(2500 + 12000));
    expect(tip()).toBeNull();
    expect(localStorage.getItem("ep-theme-tip")).toBeNull();
  });

  it("isn't shown to visitors who already chose a theme", () => {
    localStorage.setItem("ep-theme", "clean");
    render(<ThemePicker />);
    act(() => vi.advanceTimersByTime(5000));
    expect(tip()).toBeNull();
  });

  it("waits while a seasonal invitation is due, since that one already invites them", () => {
    vi.setSystemTime(new Date(2026, 9, 20)); // Halloween invitation window
    const { unmount } = render(<ThemePicker />);
    act(() => vi.advanceTimersByTime(5000));
    expect(tip()).toBeNull();
    unmount();
    localStorage.setItem("ep-theme-nudge:halloween-2026", "dismissed");
    render(<ThemePicker />);
    act(() => vi.advanceTimersByTime(2500));
    expect(tip()).not.toBeNull();
  });
});
