"use client";

import { useEffect, useRef, useState } from "react";
import type {
  CategoryScore,
  FieldMetric,
  MetricResult,
  Opportunity,
  PerformanceResponse,
  Rating,
  Strategy,
} from "@/lib/pagespeed";

// Progress messages shown while a test runs; {device} is swapped for "phone" or "desktop"
const STAGES = [
  "Loading the page on a simulated {device}…",
  "Measuring how quickly content appears…",
  "Checking layout stability and interactivity…",
  "Auditing accessibility, best practices and SEO…",
  "Putting the report together…",
];

// Tailwind classes and labels for each rating, shared by every score, metric and dot
const RATING = {
  good: { text: "text-emerald-600 dark:text-emerald-400", stroke: "stroke-emerald-500", fill: "bg-emerald-500", soft: "bg-emerald-50 dark:bg-emerald-950/40", label: "Good" },
  average: { text: "text-amber-600 dark:text-amber-400", stroke: "stroke-amber-500", fill: "bg-amber-500", soft: "bg-amber-50 dark:bg-amber-950/40", label: "Needs improvement" },
  poor: { text: "text-rose-600 dark:text-rose-400", stroke: "stroke-rose-500", fill: "bg-rose-500", soft: "bg-rose-50 dark:bg-rose-950/40", label: "Poor" },
  none: { text: "text-slate-400", stroke: "stroke-slate-300", fill: "bg-slate-300", soft: "bg-slate-50 dark:bg-slate-800", label: "No data" },
} satisfies Record<Rating, Record<string, string>>;

/** Maps a 0–100 category score to a Lighthouse rating band (90+ good, 50+ average). */
function ratingOf(score: number | null): Rating {
  if (score == null) return "none";
  return score >= 90 ? "good" : score >= 50 ? "average" : "poor";
}

/** Formats an ISO date as a short, locale-aware date and time. */
function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

/** Describes how long ago an ISO time was, e.g. "3 min ago" or "just now". */
function minutesAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  return mins < 1 ? "just now" : `${mins} min ago`;
}

/**
 * Device picker, run button and live report for the /performance page. Calls `/api/performance`
 * and shows progress while Lighthouse runs, then the full report or an error.
 * @param props.url - The address being tested, shown before the first run.
 */
export default function PerformanceRunner({ url }: { url: string }) {
  const [strategy, setStrategy] = useState<Strategy>("desktop");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setElapsed(performance.now() - startRef.current), 250);
    return () => clearInterval(id);
  }, [status]);

  async function run() {
    setStatus("running");
    setError(null);
    setElapsed(0);
    startRef.current = performance.now();
    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.result) {
        setError(json?.error ?? "The performance test couldn't run right now. Please try again in a minute.");
        setStatus("error");
        return;
      }
      setData(json);
      setStatus("done");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  const running = status === "running";
  const secs = elapsed / 1000;
  // Move to the next progress message every 6 seconds, staying on the last one
  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(secs / 6))].replace("{device}", strategy === "mobile" ? "phone" : "desktop");

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="inline-flex w-fit rounded-full bg-slate-100 p-1 text-sm dark:bg-slate-800" role="radiogroup" aria-label="Device">
          {(["desktop", "mobile"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={strategy === s}
              disabled={running}
              onClick={() => setStrategy(s)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium capitalize transition-colors disabled:cursor-not-allowed ${
                strategy === s
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <DeviceIcon device={s} />
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:translate-y-0 disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {running ? <Spinner /> : <BoltIcon />}
          {running ? `Testing… ${Math.floor(secs)}s` : data ? "Run again" : "Run performance test"}
        </button>
      </div>

      <div aria-live="polite">
        {running && (
          <div className="mt-8 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{stage}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-slate-900 transition-[width] duration-500 ease-out dark:bg-white"
                style={{ width: `${Math.min(95, (1 - Math.exp(-secs / 14)) * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">This usually takes 15–40 seconds.</p>
          </div>
        )}

        {status === "error" && error && (
          <div role="alert" className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            <p className="font-semibold">Couldn&apos;t run the test</p>
            <p className="mt-1 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {data && !running && <Report data={data} key={data.result.fetchTime + data.result.strategy} />}
      </div>

      {!data && !running && status !== "error" && (
        <p className="mt-6 text-sm text-slate-500">
          Tests <span className="font-mono text-slate-700 dark:text-slate-300">{url}</span> — results are shared and
          cached for up to 10 minutes.
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

/** The full test report: category scores, core metrics, real-visitor data and suggestions. */
function Report({ data }: { data: PerformanceResponse }) {
  const { result, cached } = data;
  return (
    <div className="mt-10">
      <div className="animate-fade-up flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
        <span className="capitalize">{result.strategy}</span>
        <span aria-hidden="true">·</span>
        <span>{formatDate(result.fetchTime)}</span>
        {result.lighthouseVersion && (
          <>
            <span aria-hidden="true">·</span>
            <span>Lighthouse {result.lighthouseVersion}</span>
          </>
        )}
        {cached && (
          <span
            className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            title="Results are cached for up to 10 minutes"
          >
            Saved result · {minutesAgo(result.fetchTime)}
          </span>
        )}
      </div>

      {/* Scores */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {result.categories.map((c, i) => (
          <Gauge key={c.id} category={c} delay={i * 80} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <Legend rating="poor" range="0–49" />
        <Legend rating="average" range="50–89" />
        <Legend rating="good" range="90–100" />
      </div>

      {/* Lab metrics + screenshot */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Core metrics</h2>
        <p className="mt-1 text-sm text-slate-500">From a single simulated visit. Hover a metric to learn what it means.</p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <dl className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            {result.metrics.map((m, i) => (
              <Metric key={m.id} metric={m} delay={300 + i * 50} />
            ))}
          </dl>
          {result.screenshot && (
            <figure className="animate-fade-up shrink-0 self-center sm:self-start" style={{ animationDelay: "500ms" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URI from Lighthouse */}
              <img
                src={result.screenshot}
                alt={`How the page looked at the end of the ${result.strategy} test`}
                className={`rounded-xl border border-slate-200 object-cover object-top shadow-sm dark:border-slate-800 ${
                  result.strategy === "mobile" ? "h-64 w-32" : "h-40 w-64 sm:w-56"
                }`}
              />
              <figcaption className="mt-2 text-center text-xs text-slate-400">What Lighthouse saw</figcaption>
            </figure>
          )}
        </div>
      </section>

      {/* Field data */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Real visitors</h2>
        {result.field ? (
          <>
            <p className="mt-1 text-sm text-slate-500">
              Chrome users over the last 28 days ·{" "}
              <span className={RATING[result.field.overall].text}>{RATING[result.field.overall].label}</span>
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {result.field.metrics.map((m) => (
                <FieldCard key={m.id} metric={m} />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-500">
            Chrome doesn&apos;t have enough real-visitor data for this site yet, so the scores above come from a
            simulated visit only.
          </p>
        )}
      </section>

      {/* Opportunities */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">What to improve</h2>
        {result.opportunities.length ? (
          <ul className="mt-4 flex flex-col gap-3">
            {result.opportunities.map((o, i) => (
              <OpportunityRow key={o.id} item={o} delay={i * 50} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            Nothing significant to fix — nice.
          </p>
        )}
      </section>

      {result.warnings.length > 0 && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {result.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      <p className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-200 pt-5 text-sm text-slate-500 dark:border-slate-800">
        Scores can shift a few points between runs.
        <a href={result.reportUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white">
          Open the full report on PageSpeed Insights ↗
        </a>
      </p>
    </div>
  );
}

/**
 * Animated ring showing one category score, coloured by its rating.
 * @param props.delay - Animation delay in ms, so the gauges appear one after another.
 */
function Gauge({ category, delay }: { category: CategoryScore; delay: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const rating = ratingOf(category.score);
  // Hide the part of the ring's stroke that the score doesn't fill
  const offset = circ * (1 - (category.score ?? 0) / 100);
  return (
    <div
      className={`animate-fade-up flex flex-col items-center rounded-2xl border border-slate-200 p-4 dark:border-slate-800 ${RATING[rating].soft}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 88 88" className="h-24 w-24 -rotate-90" aria-hidden="true">
          <circle cx="44" cy="44" r={r} fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-slate-700" />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className={`animate-gauge ${RATING[rating].stroke}`}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ "--gauge-circumference": `${circ}`, animationDelay: `${delay}ms` } as React.CSSProperties}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-mono text-2xl font-semibold tabular-nums ${RATING[rating].text}`}>
          {category.score ?? "—"}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{category.title}</p>
    </div>
  );
}

/** Coloured dot plus score range explaining one rating colour. */
function Legend({ rating, range }: { rating: Rating; range: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${RATING[rating].fill}`} />
      {range}
    </span>
  );
}

/** Tile for one lab metric; hovering shows what the metric means. */
function Metric({ metric, delay }: { metric: MetricResult; delay: number }) {
  return (
    <div
      className="animate-fade-up rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      style={{ animationDelay: `${delay}ms` }}
      title={metric.description}
    >
      <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className={`h-2 w-2 shrink-0 rounded-full ${RATING[metric.rating].fill}`} aria-label={RATING[metric.rating].label} />
        {metric.title}
      </dt>
      <dd className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${RATING[metric.rating].text}`}>{metric.displayValue}</dd>
    </div>
  );
}

/** Tile for one real-visitor (Chrome UX Report) metric and its rating. */
function FieldCard({ metric }: { metric: FieldMetric }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <p className="text-xs font-medium text-slate-500">{metric.title}</p>
      <p className={`mt-1 font-mono text-xl font-semibold tabular-nums ${RATING[metric.rating].text}`}>{metric.displayValue}</p>
      <p className={`text-xs ${RATING[metric.rating].text}`}>{RATING[metric.rating].label}</p>
    </div>
  );
}

/** One suggested improvement, with estimated savings and a "Learn more" link when available. */
function OpportunityRow({ item, delay }: { item: Opportunity; delay: number }) {
  return (
    <li className="animate-fade-up rounded-xl border border-slate-200 p-4 dark:border-slate-800" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${RATING[item.rating].fill}`} aria-label={RATING[item.rating].label} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
            {(item.savings || item.displayValue) && (
              <span className="shrink-0 font-mono text-xs text-slate-500">
                {item.savings ? `Save ~${item.savings}` : item.displayValue}
              </span>
            )}
          </div>
          {item.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>}
          {item.learnMoreUrl && (
            <a href={item.learnMoreUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white">
              Learn more ↗
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

/* ---------------------------------------------------------------- */

/** Spinning circle shown on the button while a test runs. */
function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Lightning bolt icon for the run button. */
function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}

/** Phone or monitor icon for the device picker. */
function DeviceIcon({ device }: { device: Strategy }) {
  return device === "mobile" ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" strokeLinecap="round" />
    </svg>
  );
}
