import { describe, it, expect, vi, afterEach } from "vitest";
import { DEFAULT_LAB_ITEMS, getLabItems, getLabTestStats, hostOf, isExternalHref, normalizeLabItem } from "../lab";
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
      { _id: "c", title: "Outside", href: "https://example.com/demo", preview: "website" },
      { _id: "d", title: "Not secure", href: "http://example.com" },
      { _id: "e", title: "Sneaky", href: "javascript:alert(1)" },
      { _id: "f", title: "Half a link", href: "example.com" },
    ]);
    expect(await getLabItems()).toEqual([
      { _id: "a", title: "New toy", href: "/new-toy", blurb: "Fun.", question: null, tech: ["React", "CSS", "SVG", "Extra"], status: "beta", preview: "generic" },
      { _id: "c", title: "Outside", href: "https://example.com/demo", blurb: "", question: null, tech: [], status: "live", preview: "website" },
    ]);
  });

  it("falls back to the built-in experiments when Sanity is empty or unreachable", async () => {
    sanityFetch.mockResolvedValueOnce([]);
    expect(await getLabItems()).toBe(DEFAULT_LAB_ITEMS);
    vi.spyOn(console, "error").mockImplementation(() => {});
    sanityFetch.mockRejectedValueOnce(new Error("offline"));
    expect(await getLabItems()).toBe(DEFAULT_LAB_ITEMS);
  });

  it("tells links to other sites apart from pages on this site", () => {
    expect(isExternalHref("https://247631214.hs-sites-na2.com/esteban-payret")).toBe(true);
    expect(isExternalHref("/scope")).toBe(false);
    expect(isExternalHref("http://example.com")).toBe(false);
    expect(isExternalHref("https://localhost")).toBe(false);
    expect(hostOf("https://www.example.com/a")).toBe("example.com");
    expect(hostOf("/scope")).toBe("estebanpayret.com");
  });

  it("keeps an uploaded card image, but not an emptied one", () => {
    const image = { asset: { _ref: "image-abc-1200x500-png" }, hotspot: { x: 0.5, y: 0.3, width: 1, height: 1 } };
    expect(normalizeLabItem({ _id: "x", title: "X", href: "/x", image })?.image).toEqual(image);
    expect(normalizeLabItem({ _id: "x", title: "X", href: "/x", image: { crop: { top: 0, bottom: 0, left: 0, right: 0 } } })).not.toHaveProperty("image");
    expect(normalizeLabItem({ _id: "x", title: "X", href: "/x", image: null })).not.toHaveProperty("image");
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
