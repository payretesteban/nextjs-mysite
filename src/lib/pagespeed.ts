/* eslint-disable @typescript-eslint/no-explicit-any -- the raw PageSpeed Insights JSON is large and untyped */
/**
 * PageSpeed Insights (runs Lighthouse on Google's servers) → a compact result for /performance.
 * Docs: https://developers.google.com/speed/docs/insights/v5/get-started
 */

import { SITE_ORIGIN } from "./site";

export type Strategy = "mobile" | "desktop";
export type Rating = "good" | "average" | "poor" | "none";

/** The page PageSpeed Insights tests: the homepage at the canonical (www) address. */
export const SITE_URL = `${SITE_ORIGIN}/`;

export interface CategoryScore {
  id: string;
  title: string;
  score: number | null; // 0–100
}

export interface MetricResult {
  id: string;
  title: string;
  displayValue: string;
  numericValue: number | null;
  rating: Rating;
  description: string;
}

export interface FieldMetric {
  id: string;
  title: string;
  displayValue: string;
  rating: Rating;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  learnMoreUrl: string | null;
  displayValue: string | null;
  savings: string | null;
  rating: Rating;
}

export interface PerformanceResult {
  url: string;
  strategy: Strategy;
  fetchTime: string;
  lighthouseVersion: string | null;
  categories: CategoryScore[];
  metrics: MetricResult[];
  field: { overall: Rating; metrics: FieldMetric[] } | null;
  opportunities: Opportunity[];
  screenshot: string | null;
  warnings: string[];
  reportUrl: string;
}

export interface PerformanceResponse {
  result: PerformanceResult;
  cached: boolean;
  /** When a fresh run becomes possible again (ISO). */
  freshAfter: string;
}

/* ---------------------------------------------------------------- */

export const CATEGORY_ORDER = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["best-practices", "Best practices"],
  ["seo", "SEO"],
] as const;

const LAB_METRICS: [string, string][] = [
  ["first-contentful-paint", "First Contentful Paint"],
  ["largest-contentful-paint", "Largest Contentful Paint"],
  ["total-blocking-time", "Total Blocking Time"],
  ["cumulative-layout-shift", "Cumulative Layout Shift"],
  ["speed-index", "Speed Index"],
];

const FIELD_METRICS: [string, string, (p: number) => string][] = [
  ["LARGEST_CONTENTFUL_PAINT_MS", "Largest Contentful Paint", (p) => `${(p / 1000).toFixed(1)} s`],
  ["INTERACTION_TO_NEXT_PAINT", "Interaction to Next Paint", (p) => `${Math.round(p)} ms`],
  ["CUMULATIVE_LAYOUT_SHIFT_SCORE", "Cumulative Layout Shift", (p) => (p / 100).toFixed(2)],
  ["FIRST_CONTENTFUL_PAINT_MS", "First Contentful Paint", (p) => `${(p / 1000).toFixed(1)} s`],
  ["EXPERIMENTAL_TIME_TO_FIRST_BYTE", "Time to First Byte", (p) => `${(p / 1000).toFixed(1)} s`],
];

/** Lighthouse colour bands: 90–100 good, 50–89 average, 0–49 poor. */
export function ratingFromScore(score: number | null | undefined): Rating {
  if (score == null) return "none";
  const s = score <= 1 ? score * 100 : score;
  if (s >= 90) return "good";
  if (s >= 50) return "average";
  return "poor";
}

function ratingFromField(category?: string): Rating {
  if (category === "FAST") return "good";
  if (category === "AVERAGE") return "average";
  if (category === "SLOW") return "poor";
  return "none";
}

/** Turn Lighthouse markdown ("... [Learn more](url).") into plain text + the link. */
export function splitMarkdown(md = ""): { text: string; link: string | null } {
  const links = [...md.matchAll(/\[([^\]]+)\]\((https?:[^)]+)\)/g)];
  const learn = links.find((m) => /^learn\b/i.test(m[1])) ?? links[links.length - 1];
  const text = md
    // Drop "Learn more…" / "Learn how to…" links entirely; keep other link labels as text
    .replace(/\s*\[([^\]]+)\]\((https?:[^)]+)\)(\.?)/g, (_, label: string, _url: string, dot: string) =>
      /^learn\b/i.test(label) ? "" : ` ${label}${dot}`
    )
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return { text, link: learn ? learn[2] : null };
}

function formatSavings(audit: any): string | null {
  const ms = audit?.details?.overallSavingsMs ?? audit?.metricSavings?.LCP ?? audit?.metricSavings?.FCP;
  const bytes = audit?.details?.overallSavingsBytes;
  const parts: string[] = [];
  if (typeof ms === "number" && ms >= 50) parts.push(ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`);
  if (typeof bytes === "number" && bytes >= 1024) parts.push(`${Math.round(bytes / 1024)} KiB`);
  return parts.length ? parts.join(" · ") : null;
}

function savingsWeight(audit: any): number {
  const s = audit?.metricSavings ?? {};
  return (
    (audit?.details?.overallSavingsMs ?? 0) +
    (s.LCP ?? 0) + (s.FCP ?? 0) + (s.TBT ?? 0) + (s.INP ?? 0) + (s.CLS ?? 0) * 10_000 +
    (audit?.details?.overallSavingsBytes ?? 0) / 100
  );
}

export function reportUrl(url: string, strategy: Strategy) {
  return `https://pagespeed.web.dev/report?url=${encodeURIComponent(url)}&form_factor=${strategy}`;
}

/** Convert a raw PageSpeed Insights v5 response into what the page renders. */
export function normalizePageSpeed(json: any, strategy: Strategy): PerformanceResult {
  const lr = json?.lighthouseResult;
  if (!lr) throw new Error("PageSpeed Insights returned no Lighthouse result.");
  const audits = lr.audits ?? {};
  const url: string = lr.finalDisplayedUrl ?? lr.finalUrl ?? json.id ?? SITE_URL;

  const categories = CATEGORY_ORDER.map(([id, title]) => {
    const raw = lr.categories?.[id]?.score;
    return { id, title, score: typeof raw === "number" ? Math.round(raw * 100) : null };
  });

  const metrics = LAB_METRICS.filter(([id]) => audits[id]).map(([id, title]) => {
    const a = audits[id];
    return {
      id,
      title,
      displayValue: (a.displayValue ?? "—").replace(/ /g, " "),
      numericValue: typeof a.numericValue === "number" ? a.numericValue : null,
      rating: ratingFromScore(a.score),
      description: splitMarkdown(a.description).text,
    };
  });

  const fm = json.loadingExperience?.metrics;
  const fieldMetrics = fm
    ? FIELD_METRICS.filter(([id]) => fm[id]?.percentile != null).map(([id, title, fmt]) => ({
        id,
        title,
        displayValue: fmt(fm[id].percentile),
        rating: ratingFromField(fm[id].category),
      }))
    : [];
  const field =
    fieldMetrics.length > 0 ? { overall: ratingFromField(json.loadingExperience.overall_category), metrics: fieldMetrics } : null;

  // "What to improve": failing performance audits that aren't the headline metrics
  const perfRefs: any[] = lr.categories?.performance?.auditRefs ?? [];
  const opportunities = perfRefs
    .filter((ref) => ref.group !== "metrics" && ref.group !== "hidden")
    .map((ref) => audits[ref.id])
    .filter(
      (a) =>
        a &&
        typeof a.score === "number" &&
        a.score < 0.9 &&
        !["notApplicable", "informative", "manual", "error"].includes(a.scoreDisplayMode)
    )
    .sort((a, b) => savingsWeight(b) - savingsWeight(a) || a.score - b.score)
    .slice(0, 6)
    .map((a) => {
      const { text, link } = splitMarkdown(a.description);
      return {
        id: a.id,
        title: splitMarkdown(a.title).text,
        description: text,
        learnMoreUrl: link,
        displayValue: a.displayValue ? String(a.displayValue).replace(/ /g, " ") : null,
        savings: formatSavings(a),
        rating: ratingFromScore(a.score),
      };
    });

  const shot = audits["final-screenshot"]?.details?.data;

  return {
    url,
    strategy,
    fetchTime: lr.fetchTime ?? new Date().toISOString(),
    lighthouseVersion: lr.lighthouseVersion ?? null,
    categories,
    metrics,
    field,
    opportunities,
    screenshot: typeof shot === "string" && shot.startsWith("data:image/") ? shot : null,
    warnings: Array.isArray(lr.runWarnings) ? lr.runWarnings.map(String) : [],
    reportUrl: reportUrl(url, strategy),
  };
}

/** Call PageSpeed Insights (server-side, so the API key stays private). */
export async function fetchPageSpeed(strategy: Strategy, url = SITE_URL): Promise<PerformanceResult> {
  const params = new URLSearchParams({ url, strategy });
  for (const [id] of CATEGORY_ORDER) params.append("category", id);
  if (process.env.PAGESPEED_API_KEY) params.set("key", process.env.PAGESPEED_API_KEY);

  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(55_000),
  });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message: string = json?.error?.message ?? `PageSpeed Insights responded with ${res.status}`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return normalizePageSpeed(json, strategy);
}
