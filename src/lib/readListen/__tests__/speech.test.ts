import { describe, it, expect } from "vitest";
import { isNoveltyVoice, pickOtherVoice, pickVoice } from "../speech";

const voice = (lang: string, name: string, localService = true) => ({ lang, name, localService }) as SpeechSynthesisVoice;

describe("Choosing a voice", () => {
  const voices = [voice("en-US", "Sam"), voice("es-MX", "Paulina"), voice("es-ES", "Online Lucia", false), voice("es_ES", "Monica")];

  it("prefers an exact match that's installed on the device", () => {
    expect(pickVoice(voices, "es-ES")?.name).toBe("Monica");
  });

  it("falls back to another accent of the same language", () => {
    expect(pickVoice([voice("pt-PT", "Joana")], "pt-BR")?.name).toBe("Joana");
  });

  it("returns null when there's no voice for the language", () => {
    expect(pickVoice(voices, "de-DE")).toBeNull();
  });

  it("finds a different voice for the second person, if the device has one", () => {
    const first = pickVoice(voices, "es-ES");
    expect(pickOtherVoice(voices, "es-ES", first)?.name).not.toBe("Monica");
    expect(pickOtherVoice([voice("de-DE", "Anna")], "de-DE", voice("de-DE", "Anna"))).toBeNull();
    expect(pickOtherVoice(voices, "es-ES", null)).toBeNull();
  });

  it("never picks joke voices like Zarvox or Bubbles", () => {
    expect(isNoveltyVoice(voice("en-US", "Zarvox"))).toBe(true);
    expect(isNoveltyVoice(voice("en-US", "Samantha"))).toBe(false);
    expect(pickVoice([voice("en-US", "Bubbles"), voice("en-US", "Albert")], "en-US")).toBeNull();
    expect(pickOtherVoice([voice("en-US", "Sam"), voice("en-US", "Zarvox")], "en-US", voice("en-US", "Sam"))).toBeNull();
  });

  it("only pairs an installed voice with another installed one (and online with online)", () => {
    const sam = voice("en-US", "Sam");
    expect(pickOtherVoice([sam, voice("en-US", "Google US English", false)], "en-US", sam)).toBeNull();
    expect(pickOtherVoice([sam, voice("en-US", "Samantha")], "en-US", sam)?.name).toBe("Samantha");
  });

  it("prefers standard voices over the slow-to-load character voices", () => {
    const french = [voice("fr-FR", "Daniel (French (France))"), voice("fr-FR", "Eddy (French (France))"), voice("fr-FR", "Jacques"), voice("fr-FR", "Thomas")];
    expect(pickVoice(french, "fr-FR")?.name).toBe("Thomas");
    const german = [voice("de-DE", "Grandma (German (Germany))"), voice("de-DE", "Anna")];
    expect(pickVoice(german, "de-DE")?.name).toBe("Anna");
    // A character voice is still used when it's the only one
    expect(pickVoice([voice("it-IT", "Reed (Italian (Italy))")], "it-IT")?.name).toBe("Reed (Italian (Italy))");
    // Installed beats online, even for a standard name
    expect(pickVoice([voice("de-DE", "Google Deutsch", false), voice("de-DE", "Eddy (German (Germany))")], "de-DE")?.name).toBe("Eddy (German (Germany))");
  });
});
