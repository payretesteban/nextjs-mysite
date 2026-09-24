import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSiteMetadata } from "../seo";
import { client } from "@/sanity/client";

vi.mock("@/sanity/client", () => ({
  client: {
    fetch: vi.fn(),
  },
}));

describe("Page titles and descriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the title and description from Sanity", async () => {
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

  it("falls back to defaults when Sanity has none", async () => {
    vi.mocked(client.fetch).mockResolvedValueOnce(null);

    const metadata = await getSiteMetadata();

    expect(metadata.title).toEqual({
      default: "Esteban Payret | Tech Lead",
      template: "%s | Esteban Payret",
    });
    expect(metadata.description).toBe("Software Engineering Manager and Tech Lead.");
  });
});
