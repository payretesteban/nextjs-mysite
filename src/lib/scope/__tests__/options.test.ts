import { describe, it, expect } from "vitest";
import { NOTES_MAX, QUESTIONS, cleanNotes, decodeAnswers, encodeAnswers, parseAnswers } from "../options";

const valid = { kind: "webapp", stage: "prototype", scale: "hundreds", features: ["ai", "accounts"], team: "lead", timeline: "half", budget: "medium" };

describe("Scoping questions and answers", () => {
  it("asks seven questions, with only the budget optional and only the features multiple-choice", () => {
    expect(QUESTIONS).toHaveLength(7);
    expect(QUESTIONS.filter((q) => q.optional).map((q) => q.key)).toEqual(["budget"]);
    expect(QUESTIONS.filter((q) => q.multiple).map((q) => q.key)).toEqual(["features"]);
  });

  it("accepts complete answers, sorting features and dropping unknown ones", () => {
    expect(parseAnswers({ ...valid, features: ["ai", "rocket", "accounts", "ai"] })).toEqual({ ...valid, features: ["accounts", "ai"] });
  });

  it("rejects missing or made-up answers, and defaults the budget to 'prefer not to say'", () => {
    expect(parseAnswers({ ...valid, kind: "spaceship" })).toBeNull();
    expect(parseAnswers({ ...valid, timeline: undefined })).toBeNull();
    expect(parseAnswers(null)).toBeNull();
    expect(parseAnswers({ ...valid, budget: "lots" })?.budget).toBe("skip");
  });

  it("cleans the free-text note and keeps it short", () => {
    expect(cleanNotes("  Hello\n\n  world\u0007 ")).toBe("Hello world");
    expect(cleanNotes("a".repeat(900))).toHaveLength(NOTES_MAX);
    expect(cleanNotes(42)).toBe("");
  });

  it("saves answers in a link and reads them back, leaving the note out", () => {
    const a = parseAnswers({ ...valid, notes: "Private details" })!;
    const hash = encodeAnswers(a);
    expect(hash).not.toContain("Private");
    expect(decodeAnswers(`#${hash}`)).toEqual({ ...valid, features: ["accounts", "ai"] });
    expect(decodeAnswers("#k=webapp")).toBeNull();
  });
});
