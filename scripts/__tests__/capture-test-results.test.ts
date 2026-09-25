import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { normalizeCoverage, normalizeReport, runVitest } from "../capture-test-results.mjs";

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

describe("Turning raw results into this report", () => {
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

  it("cleans colour codes, local paths and library noise out of failure messages", () => {
    const failed = result.files[1].tests.find((t) => t.status === "failed")!;
    expect(failed.failureMessages[0]).toBe("AssertionError\n    at src/b.test.ts:10:5");
    expect(failed.failureMessages[0]).not.toContain(cwd);
  });

  it("counts pending tests as skipped and rounds durations", () => {
    const tests = result.files[1].tests;
    expect(tests[0].durationMs).toBe(5);
    expect(tests[2]).toMatchObject({ status: "skipped", durationMs: null });
  });
});

describe("Running the suite for this report", () => {
  // A stand-in for Vitest: writes (or doesn't write) a JSON report to --outputFile
  async function fakeProject(script: string) {
    const dir = await mkdtemp(path.join(os.tmpdir(), "fake-vitest-"));
    await mkdir(path.join(dir, "node_modules", "vitest"), { recursive: true });
    await writeFile(path.join(dir, "node_modules", "vitest", "vitest.mjs"), script);
    return dir;
  }

  it("runs Vitest and turns its report into this page's format", async () => {
    const dir = await fakeProject(`
      import { writeFileSync } from "node:fs";
      const out = process.argv.find((a) => a.startsWith("--outputFile=")).split("=")[1];
      writeFileSync(out, JSON.stringify({ success: process.env.NODE_ENV === "test", testResults: [
        { name: process.cwd() + "/src/a.test.ts", status: "passed", assertionResults: [{ ancestorTitles: [], title: "ok", status: "passed", duration: 1, failureMessages: [] }] },
      ] }));
    `);
    try {
      const result = await runVitest({ cwd: dir, source: "live" });
      expect(result).toMatchObject({ source: "live", success: true, summary: { total: 1, passed: 1 } });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("adds code coverage when the coverage tool is installed", async () => {
    const dir = await fakeProject(`
      import { mkdirSync, writeFileSync } from "node:fs";
      const arg = (name) => process.argv.find((a) => a.startsWith(name + "="))?.split("=")[1];
      writeFileSync(arg("--outputFile"), JSON.stringify({ success: true, testResults: [] }));
      const dir = arg("--coverage.reportsDirectory");
      mkdirSync(dir, { recursive: true });
      const t = (pct) => ({ pct });
      writeFileSync(dir + "/coverage-summary.json", JSON.stringify({ total: { lines: t(90.49), statements: t(88), functions: t(90.04), branches: t(81.15) } }));
    `);
    await mkdir(path.join(dir, "node_modules", "@vitest", "coverage-v8"), { recursive: true });
    try {
      const result = await runVitest({ cwd: dir });
      expect(result.coverage).toEqual({ lines: 90.5, statements: 88, functions: 90, branches: 81.2 });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("explains what went wrong when Vitest produces no report", async () => {
    const dir = await fakeProject(`console.error("Something broke"); process.exit(1);`);
    try {
      await expect(runVitest({ cwd: dir })).rejects.toThrow("Something broke");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("says so when Vitest isn't installed", async () => {
    await expect(runVitest({ cwd: os.tmpdir() })).rejects.toThrow(/not installed/);
  });
});

describe("Reading the coverage summary", () => {
  it("keeps the four totals, rounded to one decimal", () => {
    const t = (pct: number) => ({ pct });
    expect(normalizeCoverage({ total: { lines: t(83.094), statements: t(81.2), functions: t(79), branches: t(73.62) } })).toEqual({
      lines: 83.1,
      statements: 81.2,
      functions: 79,
      branches: 73.6,
    });
  });

  it("ignores a missing or incomplete summary", () => {
    expect(normalizeCoverage(null)).toBeNull();
    expect(normalizeCoverage({ total: { lines: { pct: 90 } } })).toBeNull();
  });
});
