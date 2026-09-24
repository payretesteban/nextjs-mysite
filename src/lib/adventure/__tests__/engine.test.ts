import { describe, it, expect } from "vitest";
import { WALKTHROUGH, getMaxScore, normalize, rankFor, start, step, suggestionsFor, type GameState, type StepResult } from "../engine";

function play(commands: string[], from?: GameState) {
  let state = from ?? start().state;
  let last: StepResult = { state, lines: [] };
  for (const cmd of commands) {
    last = step(state, cmd);
    state = last.state;
  }
  return last;
}

const text = (lines: { text: string }[]) => lines.map((l) => l.text).join("\n");
const upTo = (cmd: string, occurrence = 1) => {
  let seen = 0;
  const idx = WALKTHROUGH.findIndex((c) => c === cmd && ++seen === occurrence);
  return WALKTHROUGH.slice(0, idx);
};

describe("normalize", () => {
  it("lowercases and strips punctuation and filler words", () => {
    expect(normalize("  Follow the SEAM to the edge! ")).toBe("follow seam to edge");
    expect(normalize("Put my regulator in")).toBe("put regulator in");
  });
});

describe("The Deep Drop", () => {
  it("can be won by following best practice, for the maximum score", () => {
    const result = play(WALKTHROUGH);
    expect(result.state.status).toBe("won");
    expect(result.event).toBe("win");
    expect(result.state.score).toBe(getMaxScore());
    expect(getMaxScore()).toBe(310);
    expect(rankFor(result.state)).toBe("Cave Legend");
    expect(text(result.lines)).toMatch(/Final score 310 of 310/);
  });

  it("understands every suggestion shown in every stage", () => {
    let state = start().state;
    for (const cmd of WALKTHROUGH) {
      for (const suggestion of suggestionsFor(state)) {
        const r = step(state, suggestion);
        expect(text(r.lines), `"${suggestion}" in ${state.stage}`).not.toMatch(/doesn't seem to help/);
      }
      state = step(state, cmd).state;
    }
  });

  it("ends the game when you pull the reserve before cutting away", () => {
    const r = play([...upTo("cut away"), "pull reserve"]);
    expect(r.state.status).toBe("dead");
    expect(r.lines.some((l) => l.kind === "lesson" && /cut away first/i.test(l.text))).toBe(true);
  });

  it("ends the game when you enter the cave without a guideline", () => {
    const r = play([...upTo("enter cave").filter((c) => c !== "tie off the line"), "enter cave"]);
    expect(r.state.status).toBe("dead");
    expect(text(r.lines)).toMatch(/continuous guideline/);
  });

  it("requires buoyancy first when gearing up", () => {
    const r = play([...upTo("open valve"), "put on mask"]);
    expect(r.state.status).toBe("dead");
    expect(text(r.lines)).toMatch(/Get buoyant first/);
  });

  it("catches descending without checking the gauge", () => {
    const r = play([...upTo("descend").filter((c, i, arr) => !(c === "check gauge" && i === arr.indexOf("check gauge"))), "descend"]);
    expect(r.state.status).toBe("dead");
    expect(text(r.lines)).toMatch(/watch the gauge|Check your gauge/i);
  });

  it("requires a safety stop and buoyancy before the GPS", () => {
    expect(play([...upTo("safety stop"), "surface"]).state.status).toBe("dead");
    expect(play([...upTo("inflate BCD", 2), "activate GPS"]).state.status).toBe("dead");
  });

  it("RETRY restores the start of the stage and counts the retry", () => {
    const before = play(upTo("cut away")).state;
    const dead = play(["cut away", "wait"], before).state;
    expect(dead.status).toBe("dead");

    const retried = step(dead, "retry").state;
    expect(retried.status).toBe("playing");
    expect(retried.stage).toBe("malfunction");
    expect(retried.flags).not.toContain("cutaway");
    expect(retried.score).toBe(before.score);
    expect(retried.retries).toBe(1);
  });

  it("only accepts RETRY/RESTART after dying", () => {
    const dead = play([...upTo("cut away"), "pull reserve"]).state;
    const r = step(dead, "cut away");
    expect(r.state.stage).toBe("malfunction");
    expect(text(r.lines)).toMatch(/Type RETRY/);
  });

  it("treats unknown commands as harmless", () => {
    const r = play(["dance"]);
    expect(r.state.status).toBe("playing");
    expect(text(r.lines)).toMatch(/Type HINT/);
  });

  it("lets you leave the treasure and still survive, with a lower rank", () => {
    const beforeChamber = upTo("attach lift bag");
    const r = play([...beforeChamber, "follow the line out", "ascend slowly", "safety stop", "surface", "inflate BCD", "activate GPS"]);
    expect(r.state.status).toBe("won");
    expect(rankFor(r.state)).toMatch(/Survivor/);
    expect(text(r.lines)).toMatch(/No treasure this time/);
  });

  it("opens the contact form on HIRE", () => {
    expect(play(["hire"]).event).toBe("contact");
  });

  it("shows metric and imperial in the story", () => {
    const intro = text(start().lines);
    expect(intro).toContain("4,000 m (13,100 ft)");
  });
});
