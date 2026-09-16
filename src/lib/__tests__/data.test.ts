import { describe, it, expect, vi, beforeEach } from "vitest";
import { getIndexPageData } from "../data";
import { client } from "@/sanity/client";
import { indexPageQuery } from "@/sanity/lib/queries";

vi.mock("@/sanity/client", () => ({
  client: {
    fetch: vi.fn(),
  },
}));

describe("getIndexPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls client.fetch with indexPageQuery and correct revalidation settings", async () => {
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
