import { runVitest } from "../../../../scripts/capture-test-results.mjs";
import type { TestRunResult } from "@/lib/testResults";

export const dynamic = "force-dynamic";

// Only one run at a time — repeated clicks share the in-flight run.
let inFlight: Promise<TestRunResult> | null = null;

/**
 * Runs the Vitest suite live. Development only: on the deployed site the
 * /tests page reads the snapshot captured at build time (public/test-results.json).
 */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { source: "live", error: "Live test runs are only available in development." },
      { status: 404 }
    );
  }

  try {
    inFlight ??= runVitest({ source: "live" }).finally(() => {
      inFlight = null;
    });
    return Response.json(await inFlight);
  } catch (error) {
    return Response.json(
      { source: "live", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
