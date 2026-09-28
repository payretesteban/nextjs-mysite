import { describe, it, expect, vi, afterEach } from "vitest";
import { GeminiAnswerError, GeminiError, buildPrompt, failureReason, generateText, isTemporaryFailure, parseAiSentences, retryAfterFrom } from "../generate";

const req = { learn: "es", know: "en", level: "B1", topic: "market", variant: 2 } as const;
const geminiReply = (text: string) => ({
  ok: true,
  json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text }] } }] }),
});

describe("Writing texts with Gemini", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks for the right languages, level, topic and number of sentences", () => {
    const prompt = buildPrompt(req);
    expect(prompt).toMatch(/Spanish/);
    expect(prompt).toMatch(/English/);
    expect(prompt).toMatch(/CEFR B1/);
    expect(prompt).toMatch(/local market/);
    expect(prompt).toMatch(/exactly 4 sentences/);
    expect(prompt).toMatch(/variation number 3/);
  });

  it("keeps matching sentence pairs and cleans them up", () => {
    expect(parseAiSentences({ learn: ["**Hola.**", " Adiós. "], know: ["Hello.", "Bye."] }, "es", "en")).toEqual({
      es: ["Hola.", "Adiós."],
      en: ["Hello.", "Bye."],
    });
  });

  it("rejects answers that don't line up or look wrong", () => {
    expect(parseAiSentences({ learn: ["Hola.", "Adiós."], know: ["Hello."] }, "es", "en")).toBeNull();
    expect(parseAiSentences({ learn: ["Hola."], know: ["Hello."] }, "es", "en")).toBeNull();
    expect(parseAiSentences({ learn: ["Hola.", ""], know: ["Hello.", "Bye."] }, "es", "en")).toBeNull();
    expect(parseAiSentences({ learn: ["x".repeat(500), "Hola."], know: ["Hello.", "Bye."] }, "es", "en")).toBeNull();
    expect(parseAiSentences("nope", "es", "en")).toBeNull();
  });

  it("calls Gemini with the key in a header and returns an AI text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiReply(JSON.stringify({ learn: ["Uno.", "Dos."], know: ["One.", "Two."] })));
    vi.stubGlobal("fetch", fetchMock);

    const text = await generateText(req, { apiKey: "test-key", model: "some-model" });

    expect(text).toEqual({ topic: "market", level: "B1", source: "ai", sentences: { es: ["Uno.", "Dos."], en: ["One.", "Two."] } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/models/some-model:generateContent");
    expect(url).not.toContain("test-key");
    expect(init.headers["x-goog-api-key"]).toBe("test-key");
    expect(JSON.parse(init.body).generationConfig.responseMimeType).toBe("application/json");
  });

  it("throws on errors and unusable answers so the page can fall back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429, text: () => Promise.resolve("quota") }));
    await expect(generateText(req, { apiKey: "k" })).rejects.toThrow(/429/);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiReply("not json")));
    await expect(generateText(req, { apiKey: "k" })).rejects.toThrow(/JSON/);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiReply(JSON.stringify({ learn: ["Uno."], know: [] }))));
    await expect(generateText(req, { apiKey: "k" })).rejects.toThrow(/matching/);
  });

  it("rejects sentences that slip into another language or alphabet", () => {
    const answer = (en: string) => ({ learn: ["Hier, Marie est allée au marché.", "Elle a choisi des pommes."], know: ["Yesterday, Marie went to the market.", en] });
    expect(parseAiSentences(answer("그녀는 빨간 사과를 골랐습니다."), "fr", "en")).toBeNull();
    expect(parseAiSentences(answer("Она выбрала яблоки."), "fr", "en")).toBeNull();
    expect(parseAiSentences(answer("她选了苹果。"), "fr", "en")).toBeNull();
    // Accents and other Latin letters are fine
    expect(parseAiSentences(answer("She chose crème brûlée, jalapeños and Äpfel — 3 € each!"), "fr", "en")).not.toBeNull();
  });

  it("asks again once when the answer can't be used, then gives up", async () => {
    const bad = geminiReply(JSON.stringify({ learn: ["Uno.", "Dos."], know: ["One.", "두 번째."] }));
    const good = geminiReply(JSON.stringify({ learn: ["Uno.", "Dos."], know: ["One.", "Two."] }));
    const fetchMock = vi.fn().mockResolvedValueOnce(bad).mockResolvedValueOnce(good);
    vi.stubGlobal("fetch", fetchMock);
    expect((await generateText(req, { apiKey: "k" })).sentences.en).toEqual(["One.", "Two."]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const alwaysBad = vi.fn().mockResolvedValue(bad);
    vi.stubGlobal("fetch", alwaysBad);
    await expect(generateText(req, { apiKey: "k" })).rejects.toThrow(/matching/);
    expect(alwaysBad).toHaveBeenCalledTimes(2);
  });

  it("says why an answer was unusable: cut off, blocked or empty", async () => {
    const stopped = (finishReason: string, text = "") => ({
      ok: true,
      json: () => Promise.resolve({ candidates: [{ finishReason, content: { parts: [{ text }] } }] }),
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(stopped("MAX_TOKENS", '{"learn":["Uno.","Do')));
    await expect(generateText(req, { apiKey: "k" })).rejects.toMatchObject({ reason: "max-tokens" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(stopped("SAFETY")));
    await expect(generateText(req, { apiKey: "k" })).rejects.toMatchObject({ reason: "blocked" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(stopped("STOP")));
    await expect(generateText(req, { apiKey: "k" })).rejects.toMatchObject({ reason: "empty" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiReply("not json")));
    await expect(generateText(req, { apiKey: "k" })).rejects.toBeInstanceOf(GeminiAnswerError);
  });

  it("turns any failure into a short code that's safe to show", () => {
    expect(failureReason(new GeminiError("no such model", 404))).toBe("http-404");
    expect(failureReason(new GeminiAnswerError("x", "bad-json"))).toBe("bad-json");
    expect(failureReason(Object.assign(new Error("slow"), { name: "TimeoutError" }))).toBe("timeout");
    expect(failureReason(new Error("?"))).toBe("error");
  });

  it("leaves room for the model's thinking in the output limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiReply(JSON.stringify({ learn: ["Uno.", "Dos."], know: ["One.", "Two."] })));
    vi.stubGlobal("fetch", fetchMock);
    await generateText(req, { apiKey: "k" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).generationConfig.maxOutputTokens).toBeGreaterThanOrEqual(2048);
  });

  it("tries the backup model when the main one is overloaded", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const busy = { ok: false, status: 503, text: () => Promise.resolve('{"error":{"message":"This model is currently experiencing high demand."}}') };
    const good = geminiReply(JSON.stringify({ learn: ["Uno.", "Dos."], know: ["One.", "Two."] }));
    const fetchMock = vi.fn().mockResolvedValueOnce(busy).mockResolvedValueOnce(good);
    vi.stubGlobal("fetch", fetchMock);
    const text = await generateText(req, { apiKey: "k", model: "main-model", fallbackModels: ["backup-model"] });
    expect(text.sentences.en).toEqual(["One.", "Two."]);
    expect(fetchMock.mock.calls[0][0]).toContain("/models/main-model:");
    expect(fetchMock.mock.calls[1][0]).toContain("/models/backup-model:");
  });

  it("gives up with the last error when every model is busy, and doesn't switch for usage limits", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const busy = vi.fn().mockResolvedValue({ ok: false, status: 503, text: () => Promise.resolve("high demand") });
    vi.stubGlobal("fetch", busy);
    await expect(generateText(req, { apiKey: "k", model: "a", fallbackModels: ["b"] })).rejects.toMatchObject({ status: 503 });
    expect(busy).toHaveBeenCalledTimes(2);

    const limited = vi.fn().mockResolvedValue({ ok: false, status: 429, text: () => Promise.resolve("quota") });
    vi.stubGlobal("fetch", limited);
    await expect(generateText(req, { apiKey: "k", model: "a", fallbackModels: ["b"] })).rejects.toMatchObject({ status: 429 });
    expect(limited).toHaveBeenCalledTimes(1);
  });

  it("knows which failures are temporary", () => {
    expect(isTemporaryFailure(new GeminiError("busy", 503))).toBe(true);
    expect(isTemporaryFailure(new GeminiError("oops", 500))).toBe(true);
    expect(isTemporaryFailure(Object.assign(new Error("slow"), { name: "TimeoutError" }))).toBe(true);
    expect(isTemporaryFailure(new GeminiError("quota", 429))).toBe(false);
    expect(isTemporaryFailure(new GeminiError("bad key", 403))).toBe(false);
    expect(isTemporaryFailure(new GeminiAnswerError("x", "bad-json"))).toBe(false);
  });

  it("tells the model to stay in the two chosen languages", () => {
    expect(buildPrompt({ ...req, learn: "fr", know: "en" })).toMatch(/entirely in French.*entirely in English, using the Latin alphabet only/);
  });

  it("asks for a dialogue with alternating speakers for the conversation topic", async () => {
    const convo = { ...req, topic: "conversation", variant: 1 } as const;
    const prompt = buildPrompt(convo);
    expect(prompt).toMatch(/dialogue/);
    expect(prompt).toMatch(/Lucas says the first line, Emma the second/);
    expect(prompt).toMatch(/exactly 6 lines/);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiReply(JSON.stringify({ learn: ["Hola.", "¿Qué tal?"], know: ["Hi.", "How are you?"] }))));
    const text = await generateText(convo, { apiKey: "k" });
    expect(text.speakers).toEqual(["Lucas", "Emma"]);
  });

  it("reports usage limits with Google's suggested wait", async () => {
    const body = JSON.stringify({ error: { code: 429, details: [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "41s" }] } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429, headers: new Headers(), text: () => Promise.resolve(body) }));
    const error = await generateText(req, { apiKey: "k" }).catch((e) => e);
    expect(error).toBeInstanceOf(GeminiError);
    expect(error).toMatchObject({ status: 429, retryAfterMs: 41_000 });
  });

  it("reads the wait from a Retry-After header too, or returns null", () => {
    expect(retryAfterFrom(new Headers({ "retry-after": "120" }), "")).toBe(120_000);
    expect(retryAfterFrom(new Headers(), "no hint here")).toBeNull();
  });
});
