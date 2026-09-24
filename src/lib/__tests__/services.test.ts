import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_SERVICES, DEFAULT_SERVICES_PAGE, getServicesPageData } from "../services";
import { client } from "@/sanity/client";
import { servicesPageQuery } from "@/sanity/lib/queries";

vi.mock("@/sanity/client", () => ({ client: { fetch: vi.fn() } }));
const fetchMock = vi.mocked(client.fetch) as unknown as ReturnType<typeof vi.fn>;

describe("Loading services from Sanity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the services and page text from Sanity, refreshed every minute", async () => {
    fetchMock.mockResolvedValueOnce({
      page: { title: "What I do", intro: "Intro text", ctaTitle: null, ctaText: "" },
      services: [{ _id: "1", title: "Web Development", summary: "Sites", icon: "globe" }],
    });

    const data = await getServicesPageData();

    expect(fetchMock).toHaveBeenCalledWith(servicesPageQuery, {}, { next: { revalidate: 60 } });
    expect(data.services).toEqual([{ _id: "1", title: "Web Development", summary: "Sites", icon: "globe" }]);
    // Empty fields fall back to the defaults
    expect(data.page).toEqual({ ...DEFAULT_SERVICES_PAGE, title: "What I do", intro: "Intro text" });
  });

  it("uses the default services until they exist in Sanity", async () => {
    fetchMock.mockResolvedValueOnce({ page: null, services: [] });
    const data = await getServicesPageData();
    expect(data.services).toBe(DEFAULT_SERVICES);
    expect(data.page).toEqual(DEFAULT_SERVICES_PAGE);
  });

  it("falls back to defaults if Sanity can't be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("network"));
    const data = await getServicesPageData();
    expect(data.services).toHaveLength(5);
  });
});
