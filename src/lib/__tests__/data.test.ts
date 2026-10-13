import { describe, it, expect, vi, beforeEach } from "vitest";
import { FALLBACK_PROFILE, getAllPosts, getIndexPageData, getLayoutData } from "../data";
import { sanityFetch } from "@/sanity/fetch";
import { allPostsQuery, indexPageQuery, layoutQuery } from "@/sanity/lib/queries";

vi.mock("@/sanity/fetch", () => ({ sanityFetch: vi.fn() }));
const fetchMock = vi.mocked(sanityFetch);

describe("Loading homepage content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("asks Sanity for the homepage content", async () => {
    const data = { posts: [], postCount: 0, links: [], profile: { name: "Esteban", headline: "Lead", bio: [] } };
    fetchMock.mockResolvedValueOnce(data);
    await expect(getIndexPageData()).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(indexPageQuery);
  });

  it("still renders the homepage when Sanity is down or empty", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(getIndexPageData()).resolves.toEqual({ posts: [], postCount: 0, links: [], profile: FALLBACK_PROFILE });
    fetchMock.mockResolvedValueOnce(null);
    await expect(getIndexPageData()).resolves.toMatchObject({ profile: FALLBACK_PROFILE, posts: [] });
  });

  it("loads only the links and name for the header and footer, and never fails", async () => {
    fetchMock.mockResolvedValueOnce({ links: [{ _id: "l", title: "GitHub", url: "https://github.com/me" }], profile: { name: "Esteban Payret" } });
    await expect(getLayoutData()).resolves.toEqual({ links: [{ _id: "l", title: "GitHub", url: "https://github.com/me" }], name: "Esteban Payret" });
    expect(fetchMock).toHaveBeenCalledWith(layoutQuery);

    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(getLayoutData()).resolves.toEqual({ links: [], name: null });
  });

  it("lists every post, or none when Sanity is down", async () => {
    fetchMock.mockResolvedValueOnce([{ _id: "p" }]);
    await expect(getAllPosts()).resolves.toEqual([{ _id: "p" }]);
    expect(fetchMock).toHaveBeenCalledWith(allPostsQuery);
    fetchMock.mockResolvedValueOnce(null);
    await expect(getAllPosts()).resolves.toEqual([]);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(getAllPosts()).resolves.toEqual([]);
  });
});
