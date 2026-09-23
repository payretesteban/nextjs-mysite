#!/usr/bin/env node
/**
 * Runs the Vitest suite and writes a compact, browser-safe JSON summary.
 *
 *   node scripts/capture-test-results.mjs [--out public/test-results.json] [--source snapshot|live]
 *
 * Used in two places:
 *   - `prebuild` (npm run build) → captures a snapshot the deployed /tests page shows
 *   - `/api/tests` in development → runs the suite live when the button is clicked
 *
 * Never fails the build: if tests fail, the failures are recorded in the JSON.
 */
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_MESSAGE_LENGTH = 2000;
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

function cleanMessage(message, cwd) {
  let text = String(message).replace(ANSI_PATTERN, "");
  if (cwd) text = text.split(cwd + path.sep).join("").split(cwd).join(".");
  // Drop stack frames from node_modules / Node internals — they're noise for the reader.
  text = text
    .split("\n")
    .filter((line) => !/^\s*at .*(node_modules|node:internal)/.test(line))
    .join("\n")
    .trim();
  if (text.length > MAX_MESSAGE_LENGTH) text = text.slice(0, MAX_MESSAGE_LENGTH) + "\n…";
  return text;
}

function normalizeStatus(status) {
  if (status === "passed" || status === "failed") return status;
  if (status === "todo") return "todo";
  return "skipped"; // pending, skipped, disabled
}

/** @typedef {import("../src/lib/testResults").TestRunResult} TestRunResult */

/**
 * Convert Vitest's JSON reporter output into the shape the /tests page renders.
 * @param {any} report
 * @param {{ cwd?: string, source?: "live" | "snapshot", ranAt?: string }} [options]
 * @returns {TestRunResult}
 */
export function normalizeReport(report, { cwd = process.cwd(), source = "snapshot", ranAt } = {}) {
  const files = (report.testResults ?? []).map((file) => {
    const tests = (file.assertionResults ?? []).map((t) => ({
      name: t.title,
      fullName: t.fullName ?? [...(t.ancestorTitles ?? []), t.title].join(" "),
      ancestors: t.ancestorTitles ?? [],
      status: normalizeStatus(t.status),
      durationMs: typeof t.duration === "number" ? Math.round(t.duration) : null,
      failureMessages: (t.failureMessages ?? []).map((m) => cleanMessage(m, cwd)),
    }));
    const failed = file.status === "failed" || tests.some((t) => t.status === "failed");
    return {
      file: path.relative(cwd, file.name).split(path.sep).join("/"),
      status: failed ? "failed" : "passed",
      durationMs:
        typeof file.endTime === "number" && typeof file.startTime === "number"
          ? Math.max(0, Math.round(file.endTime - file.startTime))
          : null,
      // File-level errors (e.g. a syntax error that stops the file loading)
      error: file.message ? cleanMessage(file.message, cwd) : null,
      tests,
    };
  });

  const all = files.flatMap((f) => f.tests);
  const summary = {
    total: all.length,
    passed: all.filter((t) => t.status === "passed").length,
    failed: all.filter((t) => t.status === "failed").length,
    skipped: all.filter((t) => t.status === "skipped" || t.status === "todo").length,
    files: files.length,
  };
  const ends = (report.testResults ?? []).map((f) => f.endTime).filter((n) => typeof n === "number");
  const durationMs =
    typeof report.startTime === "number" && ends.length
      ? Math.max(0, Math.round(Math.max(...ends) - report.startTime))
      : files.reduce((sum, f) => sum + (f.durationMs ?? 0), 0);

  return {
    source,
    ranAt: ranAt ?? new Date().toISOString(),
    success: Boolean(report.success) && summary.failed === 0 && files.every((f) => !f.error),
    durationMs,
    summary,
    files: files.sort((a, b) => a.file.localeCompare(b.file)),
  };
}

/**
 * Run Vitest once and return the normalized result.
 * @param {{ cwd?: string, source?: "live" | "snapshot", timeoutMs?: number }} [options]
 * @returns {Promise<TestRunResult>}
 */
export async function runVitest({ cwd = process.cwd(), source = "snapshot", timeoutMs = 120_000 } = {}) {
  const vitestBin = path.join(cwd, "node_modules", "vitest", "vitest.mjs");
  if (!existsSync(vitestBin)) throw new Error("Vitest is not installed (node_modules/vitest missing).");

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "vitest-report-"));
  const reportPath = path.join(tmpDir, "report.json");
  try {
    const stderr = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [vitestBin, "run", "--reporter=json", `--outputFile=${reportPath}`],
        { cwd, env: { ...process.env, CI: "1", FORCE_COLOR: "0" }, stdio: ["ignore", "ignore", "pipe"] }
      );
      let err = "";
      child.stderr.on("data", (d) => (err += d));
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`Vitest timed out after ${timeoutMs / 1000}s`));
      }, timeoutMs);
      child.on("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
      // Vitest exits non-zero when tests fail — that's a result, not an error.
      child.on("close", () => {
        clearTimeout(timer);
        resolve(err);
      });
    });

    if (!existsSync(reportPath)) {
      throw new Error(cleanMessage(stderr.trim() || "Vitest produced no report.", cwd));
    }
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    return normalizeReport(report, { cwd, source });
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (name, fallback) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  const out = path.resolve(arg("--out", "public/test-results.json"));
  const source = arg("--source", "snapshot");

  let result;
  try {
    result = await runVitest({ source });
  } catch (error) {
    result = { source, ranAt: new Date().toISOString(), error: String(error?.message ?? error) };
  }
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(result, null, 2));

  if (result.error) console.warn(`[tests] Could not capture test results: ${result.error}`);
  else {
    const s = result.summary;
    console.log(`[tests] ${s.passed}/${s.total} passed, ${s.failed} failed → ${path.relative(process.cwd(), out)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
