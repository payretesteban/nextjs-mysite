import { describe, it, expect, vi, beforeEach } from "vitest";
import { getIndexPageData } from "../data";
import { client } from "@/sanity/client";
import { indexPageQuery } from "@/sanity/lib/queries";

vi.mock("@/sanity/client", () => ({
  client: {
    fetch: vi.fn(),
  },
}));

describe("Loading homepage content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks Sanity for the homepage content, refreshed every 30 seconds", async () => {
    const mockData = {
      posts: [],
      links: [],
      profile: { name: "Esteban", headline: "Lead", bio: [] },
    };

    vi.mocked(client.fetch).mockResolvedValueOnce(mockData);

    const result = await getIndexPageData();

    expect(client.fetch).toHaveBeenCalledWith(
      indexPageQuery,
      {},
      { next: { revalidate: 30 } }
    );
    expect(result).toEqual(mockData);
  });
});
