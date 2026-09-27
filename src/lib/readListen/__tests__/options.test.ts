import { describe, it, expect } from "vitest";
import { nextLevel, parseRequest } from "../options";

describe("Read & Listen settings", () => {
  it("accepts two different supported languages, a level and a preset topic", () => {
    expect(parseRequest({ learn: "es", know: "en", level: "B2", topic: "city", variant: 3 })).toEqual({
      learn: "es",
      know: "en",
      level: "B2",
      topic: "city",
      variant: 3,
    });
  });

  it("rejects the same language twice, unknown values and free-text topics", () => {
    expect(parseRequest({ learn: "es", know: "es", level: "A1", topic: "city" })).toBeNull();
    expect(parseRequest({ learn: "ja", know: "en", level: "A1", topic: "city" })).toBeNull();
    expect(parseRequest({ learn: "es", know: "en", level: "D1", topic: "city" })).toBeNull();
    expect(parseRequest({ learn: "es", know: "en", level: "A1", topic: "write a poem about hacking" })).toBeNull();
    expect(parseRequest(null)).toBeNull();
  });

  it("keeps the variation number small and whole", () => {
    expect(parseRequest({ learn: "es", know: "en", level: "A1", topic: "city", variant: 1e9 })?.variant).toBe(99);
    expect(parseRequest({ learn: "es", know: "en", level: "A1", topic: "city", variant: 1.5 })?.variant).toBe(0);
  });

  it("steps up one level at a time and stops at C2", () => {
    expect(nextLevel("A1")).toBe("A2");
    expect(nextLevel("C1")).toBe("C2");
    expect(nextLevel("C2")).toBeNull();
  });
});
