import { describe, it, expect } from "vitest";
import { LIBRARY, libraryText } from "../library";
import { LANGUAGES, LEVELS } from "../options";

describe("Built-in texts", () => {
  it("has every level for each library topic, in all six languages, with matching sentences", () => {
    const topics = [...new Set(LIBRARY.map((e) => e.topic))];
    expect(topics.length).toBeGreaterThanOrEqual(3);
    for (const topic of topics) {
      for (const level of LEVELS) {
        const entry = LIBRARY.find((e) => e.topic === topic && e.level === level.id);
        expect(entry, `${topic} ${level.id}`).toBeDefined();
        const counts = LANGUAGES.map((l) => entry!.sentences[l.code]?.length);
        expect(new Set(counts).size, `${topic} ${level.id} sentence counts`).toBe(1);
        for (const l of LANGUAGES) {
          for (const s of entry!.sentences[l.code]) expect(s.trim().length, `${topic} ${level.id} ${l.code}`).toBeGreaterThan(3);
        }
      }
    }
  });

  it("returns only the two requested languages, for the requested topic when it exists", () => {
    const text = libraryText("fr", "de", "B1", "travel");
    expect(text).toMatchObject({ topic: "travel", level: "B1", source: "library" });
    expect(Object.keys(text.sentences).sort()).toEqual(["de", "fr"]);
  });

  it("moves on to other topics for later variants and for topics without built-in texts", () => {
    expect(libraryText("es", "en", "A1", "market", 1).topic).not.toBe("market");
    const other = libraryText("es", "en", "C2", "nature");
    expect(other.level).toBe("C2");
    expect(other.sentences.es?.length).toBeGreaterThan(0);
  });

  it("includes a conversation at every level, with the two speakers", () => {
    for (const level of LEVELS) {
      const text = libraryText("es", "en", level.id, "conversation");
      expect(text.topic).toBe("conversation");
      expect(text.speakers).toEqual(["Sara", "Tom"]);
      expect(text.sentences.es!.length % 2, level.id).toBe(0);
    }
    expect(libraryText("es", "en", "A1", "market").speakers).toBeUndefined();
  });
});
