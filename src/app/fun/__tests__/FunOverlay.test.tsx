import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import FunOverlay from "../FunOverlay";

/** A pretend 2D canvas: records every drawing call so tests can check what was drawn. */
function fakeContext() {
  const calls: { name: string; args: unknown[] }[] = [];
  const state: Record<string, unknown> = {};
  const ctx = new Proxy(state, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      if (prop === "measureText") return (text: string) => ({ width: text.length * 10 });
      return (...args: unknown[]) => calls.push({ name: prop, args });
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  });
  /** How many times a drawing method was called. */
  const count = (name: string) => calls.filter((c) => c.name === name).length;
  /** Texts written with fillText. */
  const texts = () => calls.filter((c) => c.name === "fillText").map((c) => c.args[0]);
  return { ctx, calls, state, count, texts };
}

let canvas: ReturnType<typeof fakeContext>;

/** Uses a new pretend canvas for the next overlay rendered. */
function newCanvas() {
  const next = fakeContext();
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(() => next.ctx as unknown as CanvasRenderingContext2D);
  return next;
}

/** Moves the clock forward one animation frame (about 16 ms) at a time. */
function play(ms: number) {
  act(() => {
    for (let t = 0; t < ms; t += 16) vi.advanceTimersByTime(16);
  });
}

/** The header logo the overlay reads (confetti comes from it; Deep Drop copies it). */
function renderWithLogo(ui: React.ReactElement) {
  return render(
    <>
      <header>
        <a href="#top">
          <span style={{ backgroundColor: "rgb(15, 23, 42)", color: "rgb(255, 255, 255)", fontFamily: "Geist Mono" }}>
            <span style={{ color: "rgb(56, 189, 248)" }}>&lt;</span>
            <span>EP</span>
            <span>/&gt;</span>
          </span>
        </a>
      </header>
      {ui}
    </>
  );
}

describe("Fun mode canvas", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "setInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    canvas = newCanvas();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("covers the page without blocking clicks and stays hidden from screen readers", () => {
    render(<FunOverlay effect="confetti" calm={false} />);
    const el = screen.getByTestId("fun-overlay");
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el.className).toMatch(/pointer-events-none/);
    expect(el.className).toMatch(/fixed inset-0/);
  });

  it("does nothing when the browser can't draw on a canvas", () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    render(<FunOverlay effect="confetti" calm={false} />);
    play(200);
    expect(canvas.calls).toHaveLength(0);
  });

  it("bursts 150 confetti pieces from the logo that fall and fade out", () => {
    renderWithLogo(<FunOverlay effect="confetti" calm={false} />);
    play(100);
    expect(canvas.count("fillRect")).toBeGreaterThanOrEqual(150);
    play(4000);
    expect(canvas.state.globalAlpha).toBe(0); // fully faded after about 3.7 s
  });

  it("calm confetti appears in place and fades without moving", () => {
    render(<FunOverlay effect="confetti" calm />);
    play(48);
    const early = canvas.calls.filter((c) => c.name === "translate").slice(-150).map((c) => c.args.join());
    play(200);
    const later = canvas.calls.filter((c) => c.name === "translate").slice(-150).map((c) => c.args.join());
    expect(later).toEqual(early);
  });

  it("lets bubbles rise during Scuba, and shows still, fading bubbles when calm", () => {
    render(<FunOverlay effect="scuba" calm={false} />);
    play(3000);
    expect(canvas.count("arc")).toBeGreaterThan(20);

    const calm = newCanvas();
    render(<FunOverlay effect="scuba" calm />);
    play(32);
    expect(calm.count("arc")).toBeGreaterThanOrEqual(80); // 40 bubbles, each with a shine
  });

  it("flies the parachutist across during Skydive for 5 seconds, but not in calm mode", () => {
    render(<FunOverlay effect="skydive" calm={false} />);
    play(1000);
    expect(canvas.texts()).toContain("🪂");
    play(5000);
    const afterFlight = canvas.count("fillText");
    play(500);
    expect(canvas.count("fillText")).toBe(afterFlight);

    const calm = newCanvas();
    render(<FunOverlay effect="skydive" calm />);
    play(1000);
    expect(calm.texts()).not.toContain("🪂");
  });

  it("drops a copy of the site logo in Deep Drop: it falls, splashes and sinks with bubbles", () => {
    renderWithLogo(<FunOverlay effect="deepdrop" calm={false} />);
    play(2000);
    expect(canvas.texts()).toEqual(expect.arrayContaining(["<", "EP", "/>"]));
    expect(canvas.count("roundRect")).toBeGreaterThan(0);
    expect(canvas.texts()).not.toContain("🪂");

    const ellipses = canvas.count("ellipse");
    play(4000); // hits the water at 5 s
    expect(canvas.count("ellipse")).toBeGreaterThan(ellipses);
    expect(canvas.count("arc")).toBeGreaterThan(0);

    play(4000); // gone after 9 s
    const atEnd = canvas.count("roundRect");
    play(500);
    expect(canvas.count("roundRect")).toBe(atEnd);
  });

  it("uses a fallback logo when the header logo isn't on the page", () => {
    render(<FunOverlay effect="deepdrop" calm={false} />);
    play(1000);
    expect(canvas.texts()).toEqual(expect.arrayContaining(["<", "EP", "/>"]));
  });

  it("resizes with the window, and stops drawing when it's removed", () => {
    const { unmount } = render(<FunOverlay effect="scuba" calm={false} />);
    const resizes = canvas.count("setTransform");
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(canvas.count("setTransform")).toBe(resizes + 1);

    unmount();
    const drawn = canvas.calls.length;
    play(500);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(canvas.calls.length).toBe(drawn);
  });
});
