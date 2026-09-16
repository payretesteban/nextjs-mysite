import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AnimationProvider, useAnimation } from "../AnimationContext";
import { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AnimationProvider>{children}</AnimationProvider>
);

describe("AnimationContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws error when useAnimation is used outside AnimationProvider", () => {
    // Prevent console.error from spamming test output during expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAnimation())).toThrow(
      "useAnimation must be used inside AnimationProvider"
    );
    spy.mockRestore();
  });

  it("provides initial animation state", () => {
    const { result } = renderHook(() => useAnimation(), { wrapper });

    expect(result.current.animationClass).toBe("");
    expect(result.current.timeLeft).toBe(0);
  });

  it("activates animation and starts timer when getNextAnimation is called", () => {
    const { result } = renderHook(() => useAnimation(), { wrapper });

    act(() => {
      result.current.getNextAnimation();
    });

    expect(result.current.animationClass).not.toBe("");
    expect(result.current.timeLeft).toBe(10);
  });

  it("counts down timeLeft each second and clears animation when duration expires", () => {
    const { result } = renderHook(() => useAnimation(), { wrapper });

    act(() => {
      result.current.getNextAnimation();
    });

    expect(result.current.timeLeft).toBe(10);

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(9);

    // Advance to 10 seconds total
    act(() => {
      vi.advanceTimersByTime(9000);
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.animationClass).toBe("");
  });
});
