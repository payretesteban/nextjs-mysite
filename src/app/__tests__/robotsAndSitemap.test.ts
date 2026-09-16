import { describe, it, expect, vi, beforeEach } from "vitest";
import robots from "../robots";
import sitemap from "../sitemap";
import { client } from "@/sanity/client";

vi.mock("@/sanity/client", () => ({
  client: {
    fetch: vi.fn(),
  },
}));

describe("robots route handler", () => {
  it("returns correct disallow and sitemap metadata rules", () => {
    const robotConfig = robots();
    expect(robotConfig).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: "/studio/",
      },
      sitemap: "https://estebanpayret.com/sitemap.xml",
    });
  });
});

describe("sitemap route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches post slugs and returns formatted sitemap array", async () => {
    const mockPosts = [
      { slug: "post-1", _updatedAt: "2026-01-01T00:00:00.000Z" },
      { slug: "post-2", _updatedAt: "2026-02-01T00:00:00.000Z" },
    ];

    vi.mocked(client.fetch).mockResolvedValueOnce(mockPosts);

    const result = await sitemap();

    expect(result.length).toBe(3);
    expect(result[0].url).toBe("https://estebanpayret.com");
    expect(result[1].url).toBe("https://estebanpayret.com/blog/post-1");
    expect(result[2].url).toBe("https://estebanpayret.com/blog/post-2");
  });
});
