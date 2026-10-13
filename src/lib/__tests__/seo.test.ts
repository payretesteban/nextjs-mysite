import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSiteMetadata } from "../seo";
import { sanityFetch } from "@/sanity/fetch";

vi.mock("@/sanity/fetch", () => ({ sanityFetch: vi.fn() }));
const fetchMock = vi.mocked(sanityFetch);

const DEFAULTS = {
  title: { default: "Esteban Payret | Tech Lead", template: "%s | Esteban Payret" },
  description: "Software Engineering Manager and Tech Lead.",
};

describe("Page titles and descriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the title and description from Sanity", async () => {
    fetchMock.mockResolvedValueOnce({ title: "Custom Title", description: "Custom Description" });
    const metadata = await getSiteMetadata();
    expect(metadata.title).toEqual({ default: "Custom Title", template: "%s | Custom Title" });
    expect(metadata.description).toBe("Custom Description");
  });

  it("falls back to defaults when Sanity has none", async () => {
    fetchMock.mockResolvedValueOnce(null);
    await expect(getSiteMetadata()).resolves.toMatchObject(DEFAULTS);
  });

  it("falls back to defaults when Sanity can't be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(getSiteMetadata()).resolves.toMatchObject(DEFAULTS);
  });
});
