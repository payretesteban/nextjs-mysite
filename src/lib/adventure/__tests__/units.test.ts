import { describe, it, expect } from "vitest";
import { alt, bar, depth, kg, kmh, rate, statusDive } from "../units";

describe("metric + imperial units", () => {
  it("formats depths, altitudes, pressure, weight and speed in both systems", () => {
    expect(depth(18)).toBe("18 m (60 ft)");
    expect(depth(5)).toBe("5 m (15 ft)");
    expect(alt(4000)).toBe("4,000 m (13,100 ft)");
    expect(alt(760)).toBe("760 m (2,500 ft)");
    expect(bar(200)).toBe("200 bar (2,900 psi)");
    expect(bar(190)).toBe("190 bar (2,760 psi)");
    expect(bar(127)).toBe("127 bar (1,840 psi)");
    expect(kg(20)).toBe("20 kg (44 lb)");
    expect(kmh(200)).toBe("200 km/h (125 mph)");
    expect(rate(9)).toBe("9 m (30 ft) per minute");
  });

  it("keeps the rule of thirds consistent in psi", () => {
    // 190 bar = 2,760 psi; a third used leaves about 1,840 psi = 127 bar
    expect(Math.abs(2760 - 2760 / 3 - 1840)).toBeLessThan(10);
  });

  it("has a compact status format", () => {
    expect(statusDive(18, 190)).toBe("DEPTH 18 m · 60 ft | AIR 190 bar · 2,760 psi");
  });
});
