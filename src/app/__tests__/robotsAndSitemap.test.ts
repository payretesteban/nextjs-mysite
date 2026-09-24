import { describe, it, expect, vi, beforeEach } from "vitest";
import robots from "../robots";
import sitemap from "../sitemap";
import { client } from "@/sanity/client";
import { sitemapQuery } from "@/sanity/lib/queries";

vi.mock("@/sanity/client", () => ({
  client: {
    fetch: vi.fn(),
  },
}));
const fetchMock = vi.mocked(client.fetch) as unknown as ReturnType<typeof vi.fn>;

describe("robots route handler", () => {
  it("allows the site, blocks the studio and API routes, and points to the www sitemap", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio/", "/api/"],
      },
      sitemap: "https://www.estebanpayret.com/sitemap.xml",
    });
  });
});

describe("sitemap route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the main pages and every post at its real address", async () => {
    fetchMock.mockResolvedValueOnce({
      posts: [
        { slug: "post-1", _updatedAt: "2026-01-01T00:00:00.000Z" },
        { slug: "post-2", _updatedAt: "2026-02-01T00:00:00.000Z" },
      ],
      homeUpdatedAt: "2026-02-01T00:00:00.000Z",
      servicesUpdatedAt: "2026-03-01T00:00:00.000Z",
    });

    const result = await sitemap();

    expect(fetchMock).toHaveBeenCalledWith(sitemapQuery, {}, { next: { revalidate: 3600 } });
    expect(result.map((r) => r.url)).toEqual([
      "https://www.estebanpayret.com",
      "https://www.estebanpayret.com/services",
      "https://www.estebanpayret.com/adventure",
      "https://www.estebanpayret.com/performance",
      "https://www.estebanpayret.com/tests",
      "https://www.estebanpayret.com/post-1",
      "https://www.estebanpayret.com/post-2",
    ]);
    expect(result[0].lastModified).toEqual(new Date("2026-02-01T00:00:00.000Z"));
    expect(result[1].lastModified).toEqual(new Date("2026-03-01T00:00:00.000Z"));
    expect(result[6].lastModified).toEqual(new Date("2026-02-01T00:00:00.000Z"));
    expect(result.every((r) => !r.url.includes("/blog/"))).toBe(true);
  });

  it("still lists the main pages if Sanity can't be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("network"));

    const result = await sitemap();

    expect(result).toHaveLength(5);
    expect(result[0].url).toBe("https://www.estebanpayret.com");
  });
});
