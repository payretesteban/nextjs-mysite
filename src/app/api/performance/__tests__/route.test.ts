import { describe, it, expect, vi, afterEach } from "vitest";
import { pageSpeedSample } from "@/lib/__tests__/fixtures/pagespeed-sample";

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

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/performance", { method: "POST", body: JSON.stringify(body) }));

describe("Running a PageSpeed test", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    store.clear();
  });

  it("calls PageSpeed Insights for the chosen device and returns the normalized result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(pageSpeedSample) });
    vi.stubGlobal("fetch", fetchMock);

    const res = await post({ strategy: "desktop" });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.cached).toBe(false);
    expect(json.result.strategy).toBe("desktop");
    expect(json.result.categories[0].score).toBe(87);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("strategy")).toBe("desktop");
    expect(url.searchParams.getAll("category")).toEqual(["performance", "accessibility", "best-practices", "seo"]);
  });

  it("serves the saved result on a repeat request without calling Google again", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(pageSpeedSample) });
    vi.stubGlobal("fetch", fetchMock);

    await post({ strategy: "mobile" });
    const json = await (await post({ strategy: "mobile" })).json();

    expect(json.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("turns a quota error into a friendly 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: () => Promise.resolve({ error: { message: "Quota exceeded" } }) })
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await post({ strategy: "mobile" });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/quota is used up/i);
  });
});
