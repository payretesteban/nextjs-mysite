import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { estimate } from "@/lib/scope/estimate";
import { parseAnswers } from "@/lib/scope/options";
import { aiCooldown } from "@/lib/readListen/cooldown";

// Cache: a plain Map, so each test starts fresh
const store = new Map<string, unknown>();
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>, key: string[]) => async () => {
    const k = key.join("|");
    if (!store.has(k)) store.set(k, await fn());
    return store.get(k);
  },
}));

const { POST } = await import("../route");

const answers = { kind: "webapp", stage: "prototype", scale: "hundreds", features: ["accounts", "ai"], team: "lead", timeline: "half", budget: "skip" };
const e = estimate(parseAnswers(answers)!);
const aiText = `A large web app, roughly ${e.min}–${e.max} weeks for one senior developer. The main thing to plan for is AI quality and cost. I'd start by reviewing the prototype. Let's talk it through on a free 30-minute call.`;
const gemini = (summary: string) => ({ ok: true, json: () => Promise.resolve({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ summary }) }] } }] }) });

let ipCounter = 0;
const post = (body: unknown) =>
  POST(new Request("http://x/api/scope-summary", { method: "POST", headers: { "x-forwarded-for": `10.1.0.${++ipCounter}` }, body: JSON.stringify(body) }));

describe("Writing the scoping summary", () => {
  beforeEach(() => {
    store.clear();
    aiCooldown.reset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("asks for complete answers", async () => {
    expect((await post({ kind: "webapp" })).status).toBe(400);
  });

  it("uses the template summary when there's no AI key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(await (await post(answers)).json()).toMatchObject({ source: "template", summary: expect.stringContaining(`${e.min}–${e.max} weeks`) });
  });

  it("returns the AI summary and caches it for the same answers", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(gemini(aiText));
    vi.stubGlobal("fetch", fetchMock);
    expect(await (await post(answers)).json()).toEqual({ summary: aiText, source: "ai" });
    await post(answers);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the template when the AI invents numbers", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(gemini("This is quick: about 2 days of work, and it will be really easy to build for anyone.")));
    expect(await (await post(answers)).json()).toMatchObject({ source: "template", reason: "mismatch" });
  });

  it("tries the backup model when Google is busy, then says so", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_FALLBACK_MODELS", "backup-model");
    const busy = vi.fn().mockResolvedValue({ ok: false, status: 503, text: () => Promise.resolve("high demand") });
    vi.stubGlobal("fetch", busy);
    expect(await (await post(answers)).json()).toMatchObject({ source: "template", reason: "http-503" });
    expect(busy).toHaveBeenCalledTimes(2);
  });

  it("pauses the AI after the usage limit", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429, text: () => Promise.resolve("quota") }));
    expect(await (await post(answers)).json()).toMatchObject({ source: "template", reason: "ai-paused" });
    expect(aiCooldown.isPaused()).toBe(true);
  });
});
