import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS, INPUT_LIMITS, afterScenario, beforeScenario, clampInputs, compare, formatDuration, formatMoney, formatTokens } from "../model";

describe("AI cost case: the cost model", () => {
  it("gives the page's headline numbers for the default company", () => {
    const { before, after, tokenSaving, costSaving } = compare(DEFAULT_INPUTS);
    expect(formatTokens(before.tokens)).toBe("324M");
    expect(formatMoney(before.cost)).toBe("$2,333");
    expect(formatTokens(after.tokens)).toBe("24.4M");
    expect(formatMoney(after.cost)).toBe("$18");
    expect(Math.round(tokenSaving)).toBe(92);
    expect(Math.round(costSaving)).toBe(99);
    expect(formatDuration(before.reportSeconds)).toBe("26 min");
    expect(formatDuration(after.reportSeconds)).toBe("40 s");
    expect(formatDuration(before.syncDelaySeconds)).toBe("16 min");
  });

  it("moves data without AI after the redesign, and had no separate triage before", () => {
    const sync = afterScenario(DEFAULT_INPUTS).workflows.find((w) => w.id === "sync")!;
    expect(sync).toMatchObject({ model: "none", inputTokens: 0, outputTokens: 0, cost: 0 });
    const triage = beforeScenario(DEFAULT_INPUTS).workflows.find((w) => w.id === "triage")!;
    expect(triage.cost).toBe(0);
  });

  it("adds up its workflows", () => {
    const s = beforeScenario(DEFAULT_INPUTS);
    expect(s.tokens).toBe(s.workflows.reduce((t, w) => t + w.inputTokens + w.outputTokens, 0));
    expect(s.cost).toBeCloseTo(s.workflows.reduce((t, w) => t + w.cost, 0));
  });

  it("costs more before as the company grows, and always saves across the whole slider range", () => {
    const small = compare({ ...DEFAULT_INPUTS, records: 10_000 });
    const big = compare({ ...DEFAULT_INPUTS, records: 100_000 });
    expect(big.before.cost).toBeGreaterThan(small.before.cost);
    for (const records of [INPUT_LIMITS.records.min, INPUT_LIMITS.records.max]) {
      for (const changeRate of [INPUT_LIMITS.changeRate.min, INPUT_LIMITS.changeRate.max]) {
        for (const syncsPerDay of [INPUT_LIMITS.syncsPerDay.min, INPUT_LIMITS.syncsPerDay.max]) {
          const c = compare({ records, changeRate, syncsPerDay, reportsPerWeek: 7 });
          expect(c.after.cost).toBeLessThan(c.before.cost);
          expect(c.after.tokens).toBeLessThan(c.before.tokens);
        }
      }
    }
  });

  it("syncs less often means a longer wait before", () => {
    expect(beforeScenario({ ...DEFAULT_INPUTS, syncsPerDay: 24 }).syncDelaySeconds).toBe(3600 + 60);
  });

  it("keeps inputs inside the slider ranges", () => {
    expect(clampInputs({ records: 999_999, changeRate: 0.1, syncsPerDay: "48", reportsPerWeek: "x" })).toEqual({
      records: 200_000,
      changeRate: 0.5,
      syncsPerDay: 48,
      reportsPerWeek: DEFAULT_INPUTS.reportsPerWeek,
    });
    expect(clampInputs({ records: 41_234 }).records).toBe(40_000);
  });

  it("formats tokens, dollars and durations for people", () => {
    expect([950, 12_300, 4_800_000, 182_000_000, 2_300_000_000].map(formatTokens)).toEqual(["950", "12.3k", "4.8M", "182M", "2.3B"]);
    expect([0, 4.2, 18.4, 2333.2].map(formatMoney)).toEqual(["$0", "$4.20", "$18", "$2,333"]);
    expect([5, 40, 960, 6300].map(formatDuration)).toEqual(["5 s", "40 s", "16 min", "1.8 h"]);
  });
});
