import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, fireEvent } from "@testing-library/react";
import { AnimationProvider, useAnimation } from "../AnimationContext";
import { EFFECTS, KONAMI } from "@/lib/fun/effects";
import { ReactNode } from "react";

vi.mock("next/dynamic", () => ({ default: () => () => null }));

const wrapper = ({ children }: { children: ReactNode }) => <AnimationProvider>{children}</AnimationProvider>;

describe("Fun mode", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    delete document.documentElement.dataset.fun;
  });

  it("complains clearly when used outside its provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAnimation())).toThrow("useAnimation must be used inside AnimationProvider");
    spy.mockRestore();
  });

  it("starts with nothing playing", () => {
    const { result } = renderHook(() => useAnimation(), { wrapper });
    expect(result.current.effect).toBeNull();
    expect(result.current.animationClass).toBe("");
    expect(result.current.timeLeft).toBe(0);
  });

  it("plays a named effect, marks the page for CSS and counts down", () => {
    const { result } = renderHook(() => useAnimation(), { wrapper });
    act(() => result.current.getNextAnimation());
    const effect = result.current.effect!;
    expect(effect).not.toBeNull();
    expect(result.current.timeLeft).toBe(effect.seconds);
    expect(document.documentElement.dataset.fun).toBe(effect.id);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(effect.seconds - 1);
    act(() => vi.advanceTimersByTime(effect.seconds * 1000));
    expect(result.current.effect).toBeNull();
    expect(document.documentElement.dataset.fun).toBeUndefined();
  });

  it("goes through all six effects before repeating, never the same twice in a row", () => {
    const { result } = renderHook(() => useAnimation(), { wrapper });
    const seen: string[] = [];
    for (let i = 0; i < 18; i++) {
      act(() => result.current.getNextAnimation());
      seen.push(result.current.effect!.id);
    }
    expect(new Set(seen.slice(0, 6)).size).toBe(6);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
    expect(seen).not.toContain("deepdrop");
  });

  it("stops on request", () => {
    const { result } = renderHook(() => useAnimation(), { wrapper });
    act(() => result.current.getNextAnimation());
    act(() => result.current.stop());
    expect(result.current.effect).toBeNull();
    expect(result.current.timeLeft).toBe(0);
  });

  it("pauses the countdown while the tab is hidden", () => {
    const { result } = renderHook(() => useAnimation(), { wrapper });
    act(() => result.current.start("scuba"));
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.timeLeft).toBe(EFFECTS.scuba.seconds);
    hidden.mockRestore();
  });

  it("unlocks Deep Drop mode with the Konami code, but not while typing in a field", () => {
    const { result } = renderHook(() => useAnimation(), { wrapper });
    const input = document.createElement("input");
    document.body.appendChild(input);
    for (const key of KONAMI) fireEvent.keyDown(input, { key });
    expect(result.current.effect).toBeNull();

    for (const key of KONAMI) fireEvent.keyDown(window, { key: key.length === 1 ? key.toUpperCase() : key });
    expect(result.current.effect?.id).toBe("deepdrop");
    expect(result.current.secretFound).toBe(true);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.secretFound).toBe(false);
    input.remove();
  });
});
