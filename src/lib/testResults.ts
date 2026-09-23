export type TestStatus = "passed" | "failed" | "skipped" | "todo";

export interface TestCaseResult {
  name: string;
  fullName: string;
  ancestors: string[];
  status: TestStatus;
  durationMs: number | null;
  failureMessages: string[];
}

export interface TestFileResult {
  file: string;
  status: "passed" | "failed";
  durationMs: number | null;
  error: string | null;
  tests: TestCaseResult[];
}

export interface TestRunResult {
  source: "live" | "snapshot";
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
}

/** Shape written when tests couldn't run at all. */
export interface TestRunError {
  source: "live" | "snapshot";
  ranAt?: string;
  error: string;
}

export type TestRunResponse = TestRunResult | TestRunError;

export function isTestRunError(r: TestRunResponse): r is TestRunError {
  return "error" in r && typeof r.error === "string";
}
