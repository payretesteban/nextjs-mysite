import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TestRunner from "../TestRunner";
import type { TestRunResult } from "@/lib/testResults";

const passingRun: TestRunResult = {
  source: "live",
  ranAt: "2026-09-23T12:00:00.000Z",
  success: true,
  durationMs: 1234,
  summary: { total: 2, passed: 2, failed: 0, skipped: 0, files: 1 },
  files: [
    {
      file: "src/app/__tests__/footer.test.tsx",
      status: "passed",
      durationMs: 40,
      error: null,
      tests: [
        { name: "renders the year", fullName: "Footer renders the year", ancestors: ["Footer"], status: "passed", durationMs: 12, failureMessages: [] },
        { name: "renders the name", fullName: "Footer renders the name", ancestors: ["Footer"], status: "passed", durationMs: 8, failureMessages: [] },
      ],
    },
  ],
};

const failingRun: TestRunResult = {
  ...passingRun,
  success: false,
  summary: { total: 2, passed: 1, failed: 1, skipped: 0, files: 1 },
  files: [
    {
      ...passingRun.files[0],
      status: "failed",
      tests: [
        passingRun.files[0].tests[0],
        { ...passingRun.files[0].tests[1], status: "failed", failureMessages: ["expected 'A' to be 'B'"] },
      ],
    },
  ],
};

function mockFetch(body: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("Run tests button", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows only the button before running", () => {
    render(<TestRunner mode="live" />);
    expect(screen.getByRole("button", { name: /run tests/i })).toBeInTheDocument();
    expect(screen.queryByText(/what.s tested/i)).not.toBeInTheDocument();
  });

  it("runs tests live and shows a passing summary", async () => {
    const fetchMock = mockFetch(passingRun);
    render(<TestRunner mode="live" />);

    fireEvent.click(screen.getByRole("button", { name: /run tests/i }));

    expect(await screen.findByText("All 2 tests passed")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/tests", { method: "POST" });
    expect(screen.getByText("renders the year")).toBeInTheDocument();
    expect(screen.getByText("Live run")).toBeInTheDocument();
    // Grouped by part of the site, not by file path
    expect(screen.getByText("Header, menu & footer")).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(screen.queryByText(/footer\.test\.tsx/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run tests again/i })).toBeInTheDocument();
  });

  it("shows failures and their messages", async () => {
    mockFetch(failingRun);
    render(<TestRunner mode="live" />);

    fireEvent.click(screen.getByRole("button", { name: /run tests/i }));

    expect(await screen.findByText("1 of 2 tests failed")).toBeInTheDocument();
    expect(screen.getByText("expected 'A' to be 'B'")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /failed/i }));
    expect(screen.queryByText("renders the year")).not.toBeInTheDocument();
    expect(screen.getByText("renders the name")).toBeInTheDocument();
  });

  it("shows the results saved at build time on the live site", async () => {
    const fetchMock = mockFetch({ ...passingRun, source: "snapshot" });
    render(<TestRunner mode="snapshot" />);

    fireEvent.click(screen.getByRole("button", { name: /run tests/i }));

    expect(await screen.findByText("Build snapshot")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/test-results.json", { cache: "no-store" });
  });

  it("explains when no saved results exist", async () => {
    mockFetch({}, false);
    render(<TestRunner mode="snapshot" />);

    fireEvent.click(screen.getByRole("button", { name: /run tests/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/no test snapshot found/i));
  });
});
