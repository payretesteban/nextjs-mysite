import { describe, it, expect } from "vitest";
import { bookingNotes, estimate, fitText, sizeFor, templateSummary } from "../estimate";
import type { ScopeAnswers } from "../options";

const base: ScopeAnswers = { kind: "webapp", stage: "prototype", scale: "hundreds", features: ["accounts", "admin", "ai"], team: "lead", timeline: "half", budget: "skip" };

describe("Estimating a project", () => {
  it("adds up the starting point and every choice, and shows each one", () => {
    const e = estimate(base);
    // 8 web app + 2 accounts + 2 admin + 4 AI − 2 prototype + 1 hundreds of users = 15
    expect(e.factors).toEqual([
      { label: "Web app (starting point)", weeks: 8 },
      { label: "User accounts & login", weeks: 2 },
      { label: "Admin dashboard", weeks: 2 },
      { label: "AI features", weeks: 4 },
      { label: "Starting from a prototype", weeks: -2 },
      { label: "Hundreds of users", weeks: 1 },
    ]);
    expect([e.min, e.max]).toEqual([12, 20]);
    expect(e.size).toBe("L");
    expect(e.fit).toBe("fits");
  });

  it("gives the same answers the same result", () => {
    expect(estimate(base)).toEqual(estimate({ ...base }));
  });

  it("sizes projects from small to very large", () => {
    expect([sizeFor(4), sizeFor(10), sizeFor(20), sizeFor(30)]).toEqual(["S", "M", "L", "XL"]);
    const site = estimate({ ...base, kind: "website", stage: "designs", scale: "small", features: ["content"] });
    expect(site.size).toBe("S");
    const big = estimate({ ...base, kind: "mobile", stage: "idea", scale: "thousands", features: ["accounts", "payments", "integrations", "realtime", "sensitive"], team: "none" });
    expect(big.size).toBe("XL");
  });

  it("doesn't count AI twice for an AI project", () => {
    const e = estimate({ ...base, kind: "ai", features: ["ai"] });
    expect(e.factors.find((f) => f.label === "AI features")).toBeUndefined();
  });

  it("warns when the timeline is too short and suggests what could wait", () => {
    const e = estimate({ ...base, timeline: "asap", features: ["accounts", "payments", "realtime", "content"] });
    expect(e.fit).toBe("over");
    expect(e.deferrable).toEqual(["Payments", "Real-time updates"]);
    expect(e.risks[0].title).toBe("Timeline");
    expect(fitText("over", "asap")).toMatch(/Longer than within a month/);
    expect(fitText("flexible", "flexible")).toMatch(/flexible/);
  });

  it("picks the most relevant risks (at most three), and names phases for improvement work", () => {
    const e = estimate({ ...base, features: ["payments", "sensitive", "ai"] });
    expect(e.risks.map((r) => r.title)).toEqual(["Sensitive data", "Payments", "AI quality & cost"]);
    expect(estimate({ ...base, kind: "improve", stage: "live" }).phases.map((p) => p.name)).toEqual(["Audit", "Improve", "Release"]);
  });

  it("writes a summary and booking notes from the numbers only", () => {
    const e = estimate(base);
    expect(templateSummary(base, e)).toMatch(/^This looks like a large web app project, roughly 12–20 weeks/);
    // Acronyms keep their capitals ("AI quality", not "ai quality")
    expect(templateSummary(base, e)).toMatch(/plan for is AI quality & cost: test answers/);
    const notes = bookingNotes(base, e);
    expect(notes).toMatch(/Web app, a prototype, hundreds of users/);
    expect(notes).toMatch(/Estimate: L, 12–20 weeks/);
  });
});
