"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  isTestRunError,
  type TestCaseResult,
  type TestFileResult,
  type TestRunResponse,
  type TestRunResult,
  type TestStatus,
} from "@/lib/testResults";

type Mode = "live" | "snapshot";
type Filter = "all" | "failed" | "skipped";

const SNAPSHOT_URL = "/test-results.json";
const LIVE_URL = "/api/tests";

async function fetchResults(mode: Mode): Promise<TestRunResponse> {
  if (mode === "live") {
    const res = await fetch(LIVE_URL, { method: "POST" });
    return res.json();
  }
  const [res] = await Promise.all([
    fetch(SNAPSHOT_URL, { cache: "no-store" }),
    new Promise((r) => setTimeout(r, 400)), // brief pause so the click registers visually
  ]);
  if (!res.ok) {
    return {
      source: "snapshot",
      error: "No test snapshot found. One is generated automatically by `npm run build`.",
    };
  }
  return res.json();
}

function formatDuration(ms: number | null | undefined) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)}s`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso)
  );
}

export default function TestRunner({ mode }: { mode: Mode }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<TestRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [runId, setRunId] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setElapsed(performance.now() - startRef.current), 100);
    return () => clearInterval(id);
  }, [status]);

  async function run() {
    setStatus("running");
    setError(null);
    setElapsed(0);
    startRef.current = performance.now();
    try {
      const data = await fetchResults(mode);
      if (isTestRunError(data)) {
        setError(data.error);
        setStatus("error");
      } else {
        setResult(data);
        setRunId((n) => n + 1);
        setStatus("done");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong running the tests.");
      setStatus("error");
    }
  }

  const running = status === "running";

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:translate-y-0 disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {running ? <Spinner /> : <PlayIcon />}
          {running
            ? `Running… ${(elapsed / 1000).toFixed(1)}s`
            : result
              ? "Run tests again"
              : "Run tests"}
        </button>
        <p className="text-sm text-slate-500">
          {mode === "live"
            ? "Runs the suite live on this machine."
            : "Shows the results captured when this version of the site was built."}
        </p>
      </div>

      <div aria-live="polite">
        {status === "error" && error && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <p className="font-semibold">Couldn&apos;t run the tests</p>
            <p className="mt-1 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {result && (
          <div
            key={runId}
            className={`mt-10 transition-opacity ${running ? "opacity-50" : "opacity-100"}`}
          >
            <Results result={result} />
          </div>
        )}
      </div>
    </div>
  );
}

function Results({ result }: { result: TestRunResult }) {
  const [filter, setFilter] = useState<Filter>("all");
  const { summary } = result;

  const files = useMemo(() => {
    if (filter === "all") return result.files;
    const want = (t: TestCaseResult) =>
      filter === "failed" ? t.status === "failed" : t.status === "skipped" || t.status === "todo";
    return result.files
      .map((f) => ({ ...f, tests: f.tests.filter(want) }))
      .filter((f) => f.tests.length > 0 || (filter === "failed" && f.error));
  }, [filter, result.files]);

  const pct = (n: number) => (summary.total ? (n / summary.total) * 100 : 0);

  return (
    <>
      {/* Verdict banner */}
      <div
        className={`animate-fade-up flex items-start gap-4 rounded-2xl border p-5 ${
          result.success
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
            : "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40"
        }`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
            result.success ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {result.success ? <CheckIcon className="h-5 w-5" /> : <CrossIcon className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {result.success
              ? `All ${summary.total} tests passed`
              : summary.failed > 0
                ? `${summary.failed} of ${summary.total} tests failed`
                : "Some test files failed to run"}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                result.source === "live"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {result.source === "live" ? "Live run" : "Build snapshot"}
            </span>
            <span>
              {summary.files} files · {formatDuration(result.durationMs)} · {formatDate(result.ranAt)}
            </span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Passed" value={summary.passed} tone="text-emerald-600" delay={60} />
        <Stat label="Failed" value={summary.failed} tone={summary.failed ? "text-rose-600" : "text-slate-400"} delay={120} />
        <Stat label="Skipped" value={summary.skipped} tone={summary.skipped ? "text-amber-500" : "text-slate-400"} delay={180} />
        <Stat label="Duration" value={formatDuration(result.durationMs)} tone="text-slate-900 dark:text-slate-100" delay={240} />
      </dl>

      {/* Proportion bar */}
      <div
        className="mt-5 flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="img"
        aria-label={`${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped`}
      >
        <div className="animate-grow bg-emerald-500" style={{ width: `${pct(summary.passed)}%` }} />
        <div className="animate-grow bg-rose-500" style={{ width: `${pct(summary.failed)}%` }} />
        <div className="animate-grow bg-amber-400" style={{ width: `${pct(summary.skipped)}%` }} />
      </div>

      {/* Filters */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Results by file</h2>
        <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-sm dark:bg-slate-800" role="tablist">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label="All" count={summary.total} />
          <FilterTab active={filter === "failed"} onClick={() => setFilter("failed")} label="Failed" count={summary.failed} />
          <FilterTab active={filter === "skipped"} onClick={() => setFilter("skipped")} label="Skipped" count={summary.skipped} />
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {files.map((file, i) => (
          <FileCard key={file.file} file={file} index={i} />
        ))}
        {files.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
            Nothing to show for this filter.
          </li>
        )}
      </ul>
    </>
  );
}

function Stat({ label, value, tone, delay }: { label: string; value: number | string; tone: string; delay: number }) {
  return (
    <div
      className="animate-fade-up rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      style={{ animationDelay: `${delay}ms` }}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function FilterTab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1 font-medium transition-colors ${
        active
          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {label} <span className="tabular-nums text-slate-400">{count}</span>
    </button>
  );
}

function FileCard({ file, index }: { file: TestFileResult; index: number }) {
  const failed = file.status === "failed";
  const passed = file.tests.filter((t) => t.status === "passed").length;
  const dir = file.file.includes("/") ? file.file.slice(0, file.file.lastIndexOf("/") + 1) : "";
  const base = file.file.slice(dir.length);

  return (
    <li className="animate-fade-up" style={{ animationDelay: `${300 + index * 50}ms` }}>
      <details
        open={failed}
        className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow open:shadow-sm hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 select-none [&::-webkit-details-marker]:hidden">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${failed ? "bg-rose-500" : "bg-emerald-500"}`}
            aria-label={failed ? "failed" : "passed"}
          />
          <span className="min-w-0 flex-1 truncate font-mono text-sm">
            <span className="hidden text-slate-400 sm:inline">{dir}</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{base}</span>
          </span>
          <span className="shrink-0 text-xs tabular-nums text-slate-500">
            {passed}/{file.tests.length} · {formatDuration(file.durationMs)}
          </span>
          <ChevronIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
        </summary>

        <div className="border-t border-slate-100 dark:border-slate-800">
          {file.error && (
            <pre className="m-4 overflow-x-auto rounded-lg bg-rose-50 p-3 font-mono text-xs break-words whitespace-pre-wrap text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
              {file.error}
            </pre>
          )}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {file.tests.map((test, i) => (
              <TestRow key={`${test.fullName}-${i}`} test={test} />
            ))}
          </ul>
        </div>
      </details>
    </li>
  );
}

const STATUS_STYLES: Record<TestStatus, string> = {
  passed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  skipped: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  todo: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
};

function TestRow({ test }: { test: TestCaseResult }) {
  return (
    <li className="px-4 py-2.5">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${STATUS_STYLES[test.status]}`}
          aria-label={test.status}
        >
          {test.status === "passed" ? (
            <CheckIcon className="h-3 w-3" />
          ) : test.status === "failed" ? (
            <CrossIcon className="h-3 w-3" />
          ) : (
            <span className="h-0.5 w-2 rounded bg-current" />
          )}
        </span>
        <p className="min-w-0 flex-1 text-sm text-slate-700 dark:text-slate-300">
          {test.ancestors.length > 0 && (
            <span className="text-slate-400">{test.ancestors.join(" › ")} › </span>
          )}
          {test.name}
        </p>
        <span className="shrink-0 font-mono text-xs tabular-nums text-slate-400">
          {formatDuration(test.durationMs)}
        </span>
      </div>
      {test.failureMessages.map((msg, i) => (
        <pre
          key={i}
          className="mt-2 overflow-x-auto rounded-lg bg-rose-50 p-3 font-mono text-xs break-words whitespace-pre-wrap text-rose-800 sm:ml-8 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {msg}
        </pre>
      ))}
    </li>
  );
}

/* ---------- icons ---------- */

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true">
      <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.34-5.89a1.5 1.5 0 0 0 0-2.54L6.3 2.84Z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" className={className} aria-hidden="true">
      <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" className={className} aria-hidden="true">
      <path d="m5.5 5.5 9 9m0-9-9 9" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="m7.5 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
