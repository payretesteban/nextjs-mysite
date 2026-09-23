import { describe, it, expect } from "vitest";
import { normalizeReport } from "../capture-test-results.mjs";

const cwd = "/Users/me/site";

const report = {
  success: false,
  startTime: 1000,
  testResults: [
    {
      name: `${cwd}/src/b.test.ts`,
      status: "failed",
      startTime: 1000,
      endTime: 1300,
      message: "",
      assertionResults: [
        { ancestorTitles: ["B"], title: "works", fullName: "B works", status: "passed", duration: 4.6, failureMessages: [] },
        {
          ancestorTitles: ["B"],
          title: "breaks",
          fullName: "B breaks",
          status: "failed",
          duration: 2,
          failureMessages: [`\u001b[31mAssertionError\u001b[39m\n    at ${cwd}/src/b.test.ts:10:5\n    at ${cwd}/node_modules/vitest/x.js:1:1`],
        },
        { ancestorTitles: [], title: "later", fullName: "later", status: "pending", failureMessages: [] },
      ],
    },
    {
      name: `${cwd}/src/a.test.ts`,
      status: "passed",
      startTime: 1000,
      endTime: 1100,
      assertionResults: [{ ancestorTitles: [], title: "ok", status: "passed", duration: 1, failureMessages: [] }],
    },
  ],
};

describe("normalizeReport", () => {
  const result = normalizeReport(report, { cwd, source: "live", ranAt: "2026-01-01T00:00:00.000Z" });

  it("summarises counts and overall status", () => {
    expect(result.summary).toEqual({ total: 4, passed: 2, failed: 1, skipped: 1, files: 2 });
    expect(result.success).toBe(false);
    expect(result.durationMs).toBe(300);
    expect(result.source).toBe("live");
  });

  it("uses relative, sorted file paths", () => {
    expect(result.files.map((f) => f.file)).toEqual(["src/a.test.ts", "src/b.test.ts"]);
  });

  it("strips colour codes, absolute paths and node_modules frames from failure messages", () => {
    const failed = result.files[1].tests.find((t) => t.status === "failed")!;
    expect(failed.failureMessages[0]).toBe("AssertionError\n    at src/b.test.ts:10:5");
    expect(failed.failureMessages[0]).not.toContain(cwd);
  });

  it("maps pending tests to skipped and rounds durations", () => {
    const tests = result.files[1].tests;
    expect(tests[0].durationMs).toBe(5);
    expect(tests[2]).toMatchObject({ status: "skipped", durationMs: null });
  });
});
