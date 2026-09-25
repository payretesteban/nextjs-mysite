"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  isTestRunError,
  type TestCaseResult,
  type TestRunResponse,
  type TestRunResult,
  type TestStatus,
} from "@/lib/testResults";
import { groupByArea, type AreaGroup } from "@/lib/testGroups";

/** "live" runs the suite through the API (dev only); "snapshot" reads the build-time JSON. */
type Mode = "live" | "snapshot";
/** Which tests the results list shows. */
type Filter = "all" | "failed" | "skipped";

const SNAPSHOT_URL = "/test-results.json";
const LIVE_URL = "/api/tests";

/**
 * Gets test results for the given mode: runs the suite live via the API, or loads the build snapshot.
 * @returns The results, or an error object when there is no snapshot.
 */
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

/** Formats milliseconds as "850ms" or "1.25s"; shows a dash when unknown. */
function formatDuration(ms: number | null | undefined) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)}s`;
}

/** Formats an ISO date as a short, locale-aware date and time. */
function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso)
  );
}

/**
 * Run button and results for the /tests page, with a live timer while tests run.
 * @param props.mode - Whether to run the suite live or show the build snapshot.
 */
export default function TestRunner({ mode }: { mode: Mode }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<TestRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // Bumped on each run so the results remount and their animations replay
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

/** Summary banner, stats, coverage and the filterable list of tests grouped by part of the site. */
function Results({ result }: { result: TestRunResult }) {
  const [filter, setFilter] = useState<Filter>("all");
  const { summary } = result;

  // Filter the tests first, then group what's left by part of the site
  const areas = useMemo(() => {
    const want = (t: TestCaseResult) =>
      filter === "all" || (filter === "failed" ? t.status === "failed" : t.status === "skipped" || t.status === "todo");
    const files = result.files
      .map((f) => ({ ...f, tests: f.tests.filter(want) }))
      .filter((f) => f.tests.length > 0 || (filter !== "skipped" && f.error));
    return groupByArea(files);
  }, [filter, result.files]);
  // Count areas from all files, so the number in the banner doesn't change with the filter
  const areaCount = useMemo(() => groupByArea(result.files).length, [result.files]);

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
              {areaCount} areas of the site · {summary.files} files · {formatDuration(result.durationMs)} ·{" "}
              {formatDate(result.ranAt)}
            </span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Passed" value={summary.passed} tone="text-emerald-600" delay={60} />
        <Stat label="Failed" value={summary.failed} tone={summary.failed ? "text-rose-600" : "text-slate-500"} delay={120} />
        <Stat label="Skipped" value={summary.skipped} tone={summary.skipped ? "text-amber-600" : "text-slate-500"} delay={180} />
        {result.coverage ? (
          <CoverageStat pct={result.coverage.lines} delay={240} />
        ) : (
          <Stat label="Duration" value={formatDuration(result.durationMs)} tone="text-slate-900 dark:text-slate-100" delay={240} />
        )}
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

      {result.coverage && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">Code coverage</span>{" "}(how much of the site&apos;s
          code runs during these tests): {result.coverage.lines}% of lines · {result.coverage.statements}% of statements ·{" "}
          {result.coverage.functions}% of functions · {result.coverage.branches}% of branches
        </p>
      )}

      {/* Filters */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">What&apos;s tested</h2>
        <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-sm dark:bg-slate-800" role="tablist">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label="All" count={summary.total} />
          <FilterTab active={filter === "failed"} onClick={() => setFilter("failed")} label="Failed" count={summary.failed} />
          <FilterTab active={filter === "skipped"} onClick={() => setFilter("skipped")} label="Skipped" count={summary.skipped} />
        </div>
      </div>

      <ul
        key={filter}
        className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800"
      >
        {areas.map((area, i) => (
          <AreaRow key={area.key} area={area} index={i} openByDefault={filter !== "all" || area.status === "failed"} />
        ))}
        {areas.length === 0 && (
          <li className="p-8 text-center text-sm text-slate-500">Nothing to show for this filter.</li>
        )}
      </ul>
    </>
  );
}

/** "Coverage 89.9%" tile with a small bar; green from 80%, amber from 60%, red below. */
function CoverageStat({ pct, delay }: { pct: number; delay: number }) {
  const tone = pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-rose-600";
  const bar = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div
      className="animate-fade-up rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      style={{ animationDelay: `${delay}ms` }}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Coverage</dt>
      <dd className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${tone}`}>
        {pct}%<span className="sr-only"> of lines covered by tests</span>
      </dd>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
        <div className={`animate-grow h-full ${bar}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

/** Tile showing one summary number, such as how many tests passed. */
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

/** Tab button that switches the results filter and shows how many tests it matches. */
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
          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      }`}
    >
      {label} <span className="tabular-nums text-slate-600 dark:text-slate-400">{count}</span>
    </button>
  );
}

// Dot colour for each area's overall status
const DOT: Record<AreaGroup["status"], string> = {
  passed: "bg-emerald-500",
  failed: "bg-rose-500",
  skipped: "bg-amber-400",
};

/** One part of the site: a summary row that opens to show its checks, grouped by test group. */
function AreaRow({ area, index, openByDefault }: { area: AreaGroup; index: number; openByDefault: boolean }) {
  const failed = area.status === "failed";

  return (
    <li className="animate-fade-up" style={{ animationDelay: `${300 + index * 40}ms` }}>
      <details open={openByDefault} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 select-none hover:bg-slate-50 dark:hover:bg-slate-900 [&::-webkit-details-marker]:hidden">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[area.status]}`} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-slate-900 dark:text-slate-100">{area.label}</span>
            <span className="block text-sm text-slate-500 dark:text-slate-400">{area.description}</span>
          </span>
          <span
            className={`shrink-0 font-mono text-sm tabular-nums ${failed ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}
          >
            <span className="sr-only">{failed ? `${area.failed} failed, ` : ""}</span>
            {area.passed}/{area.total}
            <span className="sr-only"> passed</span>
          </span>
          <ChevronIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
        </summary>

        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/40">
          {area.fileErrors.map(({ file, error }) => (
            <div key={file} className="mb-4">
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                Couldn&apos;t run <span className="font-mono">{file}</span>
              </p>
              <pre className="mt-1.5 overflow-x-auto rounded-lg bg-rose-50 p-3 font-mono text-xs break-words whitespace-pre-wrap text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </pre>
            </div>
          ))}
          {area.sections.map((section) => (
            <div key={section.title} className="mb-4 last:mb-0">
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                {section.title}
              </h3>
              <ul>
                {section.tests.map((test, i) => (
                  <TestRow key={`${test.fullName}-${i}`} test={test} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </li>
  );
}

// Badge colours for each test status; todo looks the same as skipped
const STATUS_STYLES: Record<TestStatus, string> = {
  passed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  skipped: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  todo: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
};

/** One test: its status, name, duration and any failure messages. */
function TestRow({ test }: { test: TestCaseResult }) {
  // The first group title is already the section heading; show any deeper ones as a prefix
  const deeper = test.ancestors.slice(1);
  return (
    <li className="py-1.5">
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${STATUS_STYLES[test.status]}`}
          aria-label={test.status}
        >
          {test.status === "passed" ? (
            <CheckIcon className="h-2.5 w-2.5" />
          ) : test.status === "failed" ? (
            <CrossIcon className="h-2.5 w-2.5" />
          ) : (
            <span className="h-0.5 w-1.5 rounded bg-current" />
          )}
        </span>
        <p className="min-w-0 flex-1 text-sm text-slate-700 dark:text-slate-300">
          {deeper.length > 0 && <span className="text-slate-500">{deeper.join(" › ")} › </span>}
          <span className="inline-block first-letter:uppercase">{test.name}</span>
        </p>
        <span className="shrink-0 font-mono text-xs text-slate-500 tabular-nums">{formatDuration(test.durationMs)}</span>
      </div>
      {test.failureMessages.map((msg, i) => (
        <pre
          key={i}
          className="mt-2 overflow-x-auto rounded-lg bg-rose-50 p-3 font-mono text-xs break-words whitespace-pre-wrap text-rose-800 sm:ml-6 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {msg}
        </pre>
      ))}
    </li>
  );
}

/* ---------- icons ---------- */

/** Play triangle icon for the run button. */
function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true">
      <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.34-5.89a1.5 1.5 0 0 0 0-2.54L6.3 2.84Z" />
    </svg>
  );
}

/** Spinning circle shown on the button while tests run. */
function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Check mark icon for passed tests. */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" className={className} aria-hidden="true">
      <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Cross icon for failed tests. */
function CrossIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" className={className} aria-hidden="true">
      <path d="m5.5 5.5 9 9m0-9-9 9" strokeLinecap="round" />
    </svg>
  );
}

/** Chevron that rotates when an area row is opened. */
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="m7.5 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
