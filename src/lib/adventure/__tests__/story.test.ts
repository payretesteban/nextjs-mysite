import { describe, it, expect } from "vitest";
import { STAGES } from "../story";
import type { Ctx } from "../types";

// Two extremes of game progress: nothing done yet, and every flag already set
const fresh: Ctx = { has: () => false, count: () => 0 };
const veteran: Ctx = { has: () => true, count: () => 3 };
const stageIds = new Set(STAGES.map((s) => s.id));

describe("Every stage of the story", () => {
  it("always has an intro, status, hint, inventory and at least one suggestion", () => {
    for (const stage of STAGES) {
      for (const ctx of [fresh, veteran]) {
        expect(stage.intro(ctx).length, stage.id).toBeGreaterThan(0);
        expect(stage.status(ctx).length, stage.id).toBeGreaterThan(0);
        expect(stage.hint(ctx).length, stage.id).toBeGreaterThan(0);
        expect(stage.inventory(ctx).length, stage.id).toBeGreaterThan(0);
        expect(stage.suggestions(ctx).length, stage.id).toBeGreaterThan(0);
      }
    }
  });

  it("answers every command with text, a real next stage, and a lesson whenever you die", () => {
    for (const stage of STAGES) {
      for (const [i, action] of stage.actions.entries()) {
        for (const ctx of [fresh, veteran]) {
          const outcome = action.run(ctx);
          const where = `${stage.id} action ${i}`;
          expect(outcome.text.length, where).toBeGreaterThan(0);
          if (outcome.goto) expect(stageIds.has(outcome.goto), where).toBe(true);
          if (outcome.die) expect(outcome.lesson?.length, where).toBeGreaterThan(0);
          if (outcome.points) expect(outcome.points, where).toBeGreaterThan(0);
        }
      }
    }
  });
});
