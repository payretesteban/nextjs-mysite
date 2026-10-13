import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { parseBody } from "next-sanity/webhook";
import { POST } from "../route";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("next-sanity/webhook", () => ({ parseBody: vi.fn() }));

const request = () => new NextRequest("https://www.estebanpayret.com/api/revalidate", { method: "POST", body: "{}" });

describe("Refreshing pages when content is published", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("refreshes every page when Sanity sends a correctly signed webhook", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "test-secret");
    vi.mocked(parseBody).mockResolvedValue({ isValidSignature: true, body: { _type: "post" } } as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await POST(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, revalidated: "sanity", type: "post" });
    expect(parseBody).toHaveBeenCalledWith(expect.anything(), "test-secret", true);
    expect(revalidateTag).toHaveBeenCalledWith("sanity", { expire: 0 });
  });

  it("refuses requests without a valid signature", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "test-secret");
    vi.mocked(parseBody).mockResolvedValue({ isValidSignature: false, body: null } as never);
    const res = await POST(request());
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("does nothing until the secret is set up", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "");
    const res = await POST(request());
    expect(res.status).toBe(503);
    expect(parseBody).not.toHaveBeenCalled();
  });

  it("answers 400 to a request it can't read", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "test-secret");
    vi.mocked(parseBody).mockRejectedValue(new Error("bad JSON"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(request());
    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
