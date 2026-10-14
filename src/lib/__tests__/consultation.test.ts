import { describe, it, expect, vi, afterEach } from "vitest";
import { DEFAULT_CONSULTATION, calTargetFrom, cleanSteps, getConsultation } from "../consultation";
import { client } from "@/sanity/client";

vi.mock("@/sanity/client", () => ({ client: { fetch: vi.fn() } }));
const sanityFetch = vi.mocked(client.fetch) as unknown as ReturnType<typeof vi.fn>;

describe("Free consultation content", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the texts from Sanity and fills empty ones with the defaults", async () => {
    sanityFetch.mockResolvedValueOnce({ title: "Free 30-minute chat", text: "  ", bookingUrl: "https://cal.com/esteban/30min" });
    const c = await getConsultation();
    expect(c.title).toBe("Free 30-minute chat");
    expect(c.text).toBe(DEFAULT_CONSULTATION.text);
    expect(c.buttonLabel).toBe("Book a Free Consultation");
    expect(c.bookingUrl).toBe("https://cal.com/esteban/30min");
  });

  it("falls back to the defaults when Sanity is empty or unreachable", async () => {
    sanityFetch.mockResolvedValueOnce(null);
    expect(await getConsultation()).toEqual(DEFAULT_CONSULTATION);
    vi.spyOn(console, "error").mockImplementation(() => {});
    sanityFetch.mockRejectedValueOnce(new Error("offline"));
    expect(await getConsultation()).toEqual(DEFAULT_CONSULTATION);
  });

  it("recognises Cal.com links, which open as a popup", () => {
    expect(calTargetFrom("https://cal.com/esteban/30min")).toEqual({ origin: "https://cal.com", calLink: "esteban/30min" });
    expect(calTargetFrom("https://app.cal.com/esteban/30min/?duration=30")).toEqual({ origin: "https://cal.com", calLink: "esteban/30min" });
    expect(calTargetFrom("https://calendly.com/esteban/30min")).toBeNull();
    expect(calTargetFrom("http://cal.com/esteban")).toBeNull();
    expect(calTargetFrom("https://cal.com/")).toBeNull();
    expect(calTargetFrom("not a url")).toBeNull();
    expect(calTargetFrom(null)).toBeNull();
  });
});

describe("How it works steps", () => {
  it("keeps up to 3 steps with a title, trimmed, and drops empty details", () => {
    expect(
      cleanSteps([{ title: " Book " , text: " Pick a slot " }, { title: "" }, { title: "Call", text: "  " }, { title: "Plan" }, { title: "Extra" }])
    ).toEqual([
      { title: "Book", text: "Pick a slot" },
      { title: "Call", text: null },
      { title: "Plan", text: null },
    ]);
  });

  it("uses the built-in steps when Sanity has none", () => {
    expect(cleanSteps(undefined)).toBe(DEFAULT_CONSULTATION.homeSteps);
    expect(cleanSteps([{ title: "  " }])).toBe(DEFAULT_CONSULTATION.homeSteps);
    expect(DEFAULT_CONSULTATION.homeSteps).toHaveLength(3);
  });
});
