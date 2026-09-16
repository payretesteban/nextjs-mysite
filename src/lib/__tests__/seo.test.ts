import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSiteMetadata } from "../seo";
import { client } from "@/sanity/client";

vi.mock("@/sanity/client", () => ({
  client: {
    fetch: vi.fn(),
  },
}));

describe("getSiteMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns metadata using Sanity settings when available", async () => {
    vi.mocked(client.fetch).mockResolvedValueOnce({
      title: "Custom Title",
      description: "Custom Description",
    });

    const metadata = await getSiteMetadata();

    expect(metadata.title).toEqual({
      default: "Custom Title",
      template: "%s | Custom Title",
    });
    expect(metadata.description).toBe("Custom Description");
  });

  it("uses fallbacks when Sanity settings return null or empty", async () => {
    vi.mocked(client.fetch).mockResolvedValueOnce(null);

    const metadata = await getSiteMetadata();

    expect(metadata.title).toEqual({
      default: "Esteban Payret | Tech Lead",
      template: "%s | Esteban Payret",
    });
    expect(metadata.description).toBe("Software Engineering Manager and Tech Lead.");
  });
});
