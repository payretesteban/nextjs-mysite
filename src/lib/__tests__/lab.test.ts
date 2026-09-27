import { describe, it, expect, vi, afterEach } from "vitest";
import { DEFAULT_LAB_ITEMS, getLabItems, getLabTestStats, normalizeLabItem } from "../lab";
import { client } from "@/sanity/client";

vi.mock("@/sanity/client", () => ({ client: { fetch: vi.fn() } }));
const sanityFetch = vi.mocked(client.fetch) as unknown as ReturnType<typeof vi.fn>;

describe("The Lab experiments", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("has built-in experiments to show until Sanity has some", () => {
    const hrefs = DEFAULT_LAB_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const item of DEFAULT_LAB_ITEMS) {
      expect(item.href).toMatch(/^\/[a-z-]+$/);
      expect(item.question).toMatch(/\?$/);
      expect(item.tech.length).toBeGreaterThan(0);
    }
  });

  it("loads the experiments from Sanity, skipping unusable ones and filling in defaults", async () => {
    sanityFetch.mockResolvedValueOnce([
      { _id: "a", title: "New toy", href: "/new-toy", blurb: "Fun.", tech: ["React", null, "CSS", "SVG", "Extra"], status: "beta", preview: "rocket" },
      { _id: "b", title: "No address" },
      { _id: "c", title: "Outside", href: "https://example.com" },
    ]);
    expect(await getLabItems()).toEqual([
      { _id: "a", title: "New toy", href: "/new-toy", blurb: "Fun.", question: null, tech: ["React", "CSS", "SVG", "Extra"], status: "beta", preview: "generic" },
    ]);
  });

  it("falls back to the built-in experiments when Sanity is empty or unreachable", async () => {
    sanityFetch.mockResolvedValueOnce([]);
    expect(await getLabItems()).toBe(DEFAULT_LAB_ITEMS);
    vi.spyOn(console, "error").mockImplementation(() => {});
    sanityFetch.mockRejectedValueOnce(new Error("offline"));
    expect(await getLabItems()).toBe(DEFAULT_LAB_ITEMS);
  });

  it("keeps a known preview and the live status by default", () => {
    expect(normalizeLabItem({ _id: "x", title: "X", href: "/x", preview: "tests" })).toMatchObject({ preview: "tests", status: "live", tech: [] });
  });

  it("reads the latest test numbers from the build's test results", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ source: "snapshot", summary: { total: 208, passed: 207, failed: 1 }, coverage: { lines: 90.6 } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await getLabTestStats()).toEqual({ passed: 207, total: 208, coverage: 90.6 });
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/test-results\.json$/);
  });

  it("leaves the numbers out when the results can't be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await getLabTestStats()).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await getLabTestStats()).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ source: "snapshot", error: "boom" }) }));
    expect(await getLabTestStats()).toBeNull();
  });
});
