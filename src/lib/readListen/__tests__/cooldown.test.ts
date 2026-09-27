import { describe, it, expect } from "vitest";
import { createCooldown } from "../cooldown";

describe("Pausing the AI after a usage limit", () => {
  it("pauses for Google's suggested time", () => {
    const c = createCooldown();
    c.pause(60_000, 1_000);
    expect(c.isPaused(30_000)).toBe(true);
    expect(c.isPaused(61_001)).toBe(false);
  });

  it("uses 10 minutes when Google gives no time, and keeps waits between 30 seconds and an hour", () => {
    const c = createCooldown();
    c.pause(null, 0);
    expect(c.isPaused(9 * 60_000)).toBe(true);
    expect(c.isPaused(10 * 60_000 + 1)).toBe(false);

    c.reset();
    c.pause(1_000, 0);
    expect(c.isPaused(20_000)).toBe(true);

    c.reset();
    c.pause(24 * 60 * 60_000, 0);
    expect(c.isPaused(60 * 60_000 + 1)).toBe(false);
  });

  it("never shortens a pause that's already running", () => {
    const c = createCooldown();
    c.pause(5 * 60_000, 0);
    c.pause(30_000, 0);
    expect(c.isPaused(4 * 60_000)).toBe(true);
  });
});
