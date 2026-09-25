/** Outcome of a single test. */
export type TestStatus = "passed" | "failed" | "skipped" | "todo";

/** One test case from a test file. */
export interface TestCaseResult {
  name: string;
  /** Group titles plus the test name, joined with spaces. */
  fullName: string;
  /** Titles of the enclosing test groups ("describe" blocks), outermost first. */
  ancestors: string[];
  status: TestStatus;
  durationMs: number | null;
  /** Cleaned-up error messages, empty when the test passed. */
  failureMessages: string[];
}

/** Results for one test file. */
export interface TestFileResult {
  /** Path relative to the project root, with forward slashes. */
  file: string;
  status: "passed" | "failed";
  durationMs: number | null;
  /** Set when the file crashed before its tests could run (e.g. a syntax error). */
  error: string | null;
  tests: TestCaseResult[];
}

/** Code coverage totals, as percentages (0–100). */
export interface CoverageSummary {
  lines: number;
  statements: number;
  functions: number;
  branches: number;
}

/** A complete test run, as shown on the /tests page. */
export interface TestRunResult {
  /** "live" for a run from the dev server, "snapshot" for one captured at build time. */
  source: "live" | "snapshot";
  /** When the run happened (ISO). */
  ranAt: string;
  success: boolean;
  durationMs: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    files: number;
  };
  files: TestFileResult[];
  /** Present when the coverage tool is installed. */
  coverage?: CoverageSummary;
}

/** Shape written when tests couldn't run at all. */
export interface TestRunError {
  source: "live" | "snapshot";
  ranAt?: string;
  error: string;
}

/** What the API or snapshot returns: either results or an error. */
export type TestRunResponse = TestRunResult | TestRunError;

/** Tells whether a response is an error rather than a set of results. */
export function isTestRunError(r: TestRunResponse): r is TestRunError {
  return "error" in r && typeof r.error === "string";
}
