import { describe, it, expect, vi, afterEach } from "vitest";

// Minimal stand-in for Next's cache: remembers results per key, like the real one
const store = new Map<string, unknown>();
vi.mock("next/cache", () => ({
  unstable_cache:
    (fn: () => Promise<unknown>, keyParts: string[]) =>
    async () => {
      const key = keyParts.join("|");
      if (!store.has(key)) store.set(key, await fn());
      return store.get(key);
    },
}));

const { POST } = await import("../route");
const { aiCooldown } = await import("@/lib/readListen/cooldown");

let ipCounter = 0;
const post = (body: unknown, ip = `10.1.0.${++ipCounter}`) =>
  POST(new Request("http://localhost/api/read-listen", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify(body) }));
const valid = { learn: "es", know: "en", level: "A2", topic: "market", variant: 0 };
const geminiReply = (learn: string[], know: string[]) => ({
  ok: true,
  json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: JSON.stringify({ learn, know }) }] } }] }),
});

describe("Getting a Read & Listen text", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    store.clear();
    aiCooldown.reset();
  });

  it("rejects invalid settings", async () => {
    const res = await post({ ...valid, know: "es" });
    expect(res.status).toBe(400);
  });

  it("uses the built-in library when no Gemini key is set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ source: "library", topic: "market", level: "A2" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("writes a new text with Gemini and reuses it for the same pair in either order", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(geminiReply(["Uno.", "Dos."], ["One.", "Two."]));
    vi.stubGlobal("fetch", fetchMock);

    const first = await (await post(valid)).json();
    expect(first).toMatchObject({ source: "ai", sentences: { es: ["Uno.", "Dos."], en: ["One.", "Two."] } });

    const reversed = await (await post({ ...valid, learn: "en", know: "es" })).json();
    expect(reversed.sentences).toEqual(first.sentences);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the library when Gemini fails", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve("boom") }));
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ source: "library", notice: "ai-unavailable" });
  });

  it("limits each visitor to 30 texts an hour", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    for (let i = 0; i < 30; i++) expect((await post(valid, "10.9.9.9")).status).toBe(200);
    expect((await post(valid, "10.9.9.9")).status).toBe(429);
  });

  it("pauses the AI after Google's usage limit, but still serves texts it already wrote", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(geminiReply(["Uno.", "Dos."], ["One.", "Two."]))
      .mockResolvedValue({ ok: false, status: 429, headers: new Headers({ "retry-after": "60" }), text: () => Promise.resolve("quota") });
    vi.stubGlobal("fetch", fetchMock);

    expect((await (await post(valid)).json()).source).toBe("ai"); // written and saved
    const limited = await (await post({ ...valid, variant: 1 })).json();
    expect(limited).toMatchObject({ source: "library", notice: "ai-paused" });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // While paused: new combinations skip Google entirely, saved ones still come back
    expect((await (await post({ ...valid, variant: 2 })).json()).notice).toBe("ai-paused");
    expect((await (await post(valid)).json()).source).toBe("ai");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("doesn't show a notice when the site simply has no key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect((await (await post(valid)).json()).notice).toBeUndefined();
  });
});
