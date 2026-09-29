import { describe, it, expect } from "vitest";
import { EFFECTS, KONAMI, ROTATION, newRound, pushKey, shuffle } from "../effects";

describe("Fun mode effects", () => {
  it("has six regular effects plus the secret one, each with a name, emoji and length", () => {
    expect(ROTATION).toHaveLength(6);
    expect(ROTATION).not.toContain("deepdrop");
    for (const e of Object.values(EFFECTS)) {
      expect(e.name).toBeTruthy();
      expect(e.emoji).toBeTruthy();
      expect(e.seconds).toBeGreaterThanOrEqual(5);
    }
  });

  it("shuffles without losing or duplicating anything", () => {
    const out = shuffle([1, 2, 3, 4, 5], () => 0.3);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("never starts a new round with the effect that just played", () => {
    for (let i = 0; i < 50; i++) expect(newRound("confetti")[0]).not.toBe("confetti");
    // Even when the shuffle would put it first
    expect(newRound("confetti", () => 0.999)[0]).not.toBe("confetti");
  });

  it("recognises the Konami code, in upper or lower case, after other keys", () => {
    let buffer: string[] = [];
    let unlocked = false;
    for (const key of ["x", "ArrowUp", ...KONAMI.slice(0, -2), "E", "P"]) ({ buffer, unlocked } = pushKey(buffer, key));
    expect(unlocked).toBe(true);
    expect(pushKey(["ArrowUp"], "p").unlocked).toBe(false);
  });
});
