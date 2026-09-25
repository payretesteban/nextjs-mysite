import { describe, it, expect, vi, afterEach } from "vitest";
import { POST } from "../route";
import { runVitest } from "../../../../../scripts/capture-test-results.mjs";

vi.mock("../../../../../scripts/capture-test-results.mjs", () => ({ runVitest: vi.fn() }));
const runMock = vi.mocked(runVitest) as unknown as ReturnType<typeof vi.fn>;

describe("Running tests live", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    runMock.mockReset();
  });

  it("is switched off on the deployed site", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await POST();
    expect(res.status).toBe(404);
    expect(runMock).not.toHaveBeenCalled();
  });

  it("runs the suite in development and shares one run between quick repeated clicks", async () => {
    vi.stubEnv("NODE_ENV", "development");
    runMock.mockResolvedValue({ source: "live", success: true });
    const [a, b] = await Promise.all([POST(), POST()]);
    expect(await a.json()).toEqual({ source: "live", success: true });
    expect(await b.json()).toEqual({ source: "live", success: true });
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith({ source: "live" });
  });

  it("reports a run that couldn't start", async () => {
    vi.stubEnv("NODE_ENV", "development");
    runMock.mockRejectedValue(new Error("Vitest is not installed"));
    const res = await POST();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ source: "live", error: "Vitest is not installed" });
  });
});
