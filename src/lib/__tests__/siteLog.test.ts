import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSiteLog, DEFAULT_SITE_LOG } from "../siteLog";
import { client } from "@/sanity/client";
import { siteLogQuery } from "@/sanity/lib/queries";

vi.mock("@/sanity/client", () => ({ client: { fetch: vi.fn() } }));
const fetchMock = vi.mocked(client.fetch) as unknown as ReturnType<typeof vi.fn>;

describe("Loading site log notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns entries from Sanity", async () => {
    const entries = [{ _id: "x", title: "Hello", text: "World" }];
    fetchMock.mockResolvedValueOnce(entries);
    await expect(getSiteLog()).resolves.toEqual(entries);
    expect(client.fetch).toHaveBeenCalledWith(siteLogQuery, {}, { next: { revalidate: 60 } });
  });

  it("falls back to the built-in entries when Sanity has none", async () => {
    fetchMock.mockResolvedValueOnce([]);
    await expect(getSiteLog()).resolves.toBe(DEFAULT_SITE_LOG);
  });

  it("falls back to the built-in entries when Sanity fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(getSiteLog()).resolves.toBe(DEFAULT_SITE_LOG);
  });
});
