import { client } from "@/sanity/client";
import { labItemsQuery } from "@/sanity/lib/queries";
import { SITE_ORIGIN } from "./site";
import type { TestRunResponse } from "./testResults";

/**
 * Which preview a Lab card draws (small CSS/SVG pictures, no screenshots). "generic" is a plain
 * picture for experiments that don't have their own yet.
 */
export type LabPreview = "game" | "readListen" | "performance" | "tests" | "scope" | "aiCost" | "website" | "generic";

const PREVIEWS: LabPreview[] = ["game", "readListen", "performance", "tests", "scope", "aiCost", "website", "generic"];

/** One experiment shown in the homepage's "The Lab" section (edited in Sanity as "Lab experiment"). */
export interface LabItem {
  _id: string;
  /** A page on this site ("/scope") or a full https:// link to another site (opens in a new tab). */
  href: string;
  title: string;
  /** One line on what it is. */
  blurb: string;
  /** The question that started it (shows the idea behind the build). */
  question?: string | null;
  /** Main tools behind it, shown as small chips. */
  tech: string[];
  /** "beta" adds a Beta tag. */
  status: "live" | "beta";
  preview: LabPreview;
}

/** Shown if Sanity has no Lab experiments yet (or can't be reached). Same content as the Studio seed. */
export const DEFAULT_LAB_ITEMS: LabItem[] = [
  {
    _id: "lab-scope",
    href: "/scope",
    title: "Project Scoping",
    blurb: "Seven questions, then a rough size, timeline, phases and risks.",
    question: "Could an estimate explain itself instead of hiding in a spreadsheet?",
    tech: ["Rule engine", "Gemini API"],
    status: "live",
    preview: "scope",
  },
  {
    _id: "lab-ai-cost",
    href: "/ai-cost-case",
    title: "AI Cost Case",
    blurb: "A demo company's AI agents, redesigned for a fraction of the cost.",
    question: "What if AI only did the work that needs judgment?",
    tech: ["Cost model", "SVG"],
    status: "live",
    preview: "aiCost",
  },
  {
    _id: "lab-read-listen",
    href: "/read-listen",
    title: "Read & Listen",
    blurb: "AI-written texts in two languages, read aloud from A1 to C2.",
    question: "Could AI and the browser's own voices teach a language?",
    tech: ["Gemini API", "Web Speech"],
    status: "beta",
    preview: "readListen",
  },
  {
    _id: "lab-deep-drop",
    href: "/adventure",
    title: "The Deep Drop",
    blurb: "A text adventure with its own parser and scoring engine.",
    question: "Can a portfolio be played instead of read?",
    tech: ["Game engine", "TypeScript"],
    status: "live",
    preview: "game",
  },
  {
    _id: "lab-performance",
    href: "/performance",
    title: "Performance",
    blurb: "Run Google Lighthouse on this site, live.",
    question: "What if you could audit my site yourself, right now?",
    tech: ["PageSpeed API", "Caching"],
    status: "live",
    preview: "performance",
  },
  {
    _id: "lab-tests",
    href: "/tests",
    title: "Tests",
    blurb: "The site's own test suite, grouped in plain language.",
    question: "Can a test suite be readable by non-engineers?",
    tech: ["Vitest", "Coverage"],
    status: "live",
    preview: "tests",
  },
];

/** A page on this site, e.g. "/read-listen". */
const INTERNAL_HREF = /^\/[a-z0-9/-]*$/i;

/** True for a full https:// link to another site (Lab cards open those in a new tab). */
export function isExternalHref(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "https:" && url.hostname.includes(".");
  } catch {
    return false;
  }
}

/** The site name shown in the "website" card picture, e.g. "247631214.hs-sites-na2.com". */
export function hostOf(href: string): string {
  return isExternalHref(href) ? new URL(href).hostname.replace(/^www\./, "") : "estebanpayret.com";
}

/** A Lab experiment as it comes from Sanity, before cleanup (optional fields may be missing). */
type RawLabItem = Partial<Omit<LabItem, "tech">> & { tech?: string[] | null };

/**
 * Cleans one experiment from Sanity: needs a title and an address, either on this site ("/something") or
 * a full https:// link to another site; fills in
 * defaults for the rest (no chips, "live", the generic picture). Returns null for unusable entries.
 */
export function normalizeLabItem(raw: RawLabItem): LabItem | null {
  if (!raw._id || !raw.title || !raw.href) return null;
  if (!INTERNAL_HREF.test(raw.href) && !isExternalHref(raw.href)) return null;
  return {
    _id: raw._id,
    href: raw.href,
    title: raw.title,
    blurb: raw.blurb ?? "",
    question: raw.question ?? null,
    tech: (raw.tech ?? []).filter(Boolean).slice(0, 4),
    status: raw.status === "beta" ? "beta" : "live",
    preview: raw.preview && PREVIEWS.includes(raw.preview) ? raw.preview : "generic",
  };
}

/**
 * Loads the Lab experiments from Sanity in their set order (cached for 60 seconds). Falls back to
 * `DEFAULT_LAB_ITEMS` when there are none or Sanity can't be reached.
 */
export async function getLabItems(): Promise<LabItem[]> {
  try {
    const raw = await client.fetch<RawLabItem[] | null>(labItemsQuery, {}, { next: { revalidate: 60 } });
    const items = (raw ?? []).map(normalizeLabItem).filter((item): item is LabItem => item !== null);
    return items.length ? items : DEFAULT_LAB_ITEMS;
  } catch (error) {
    console.error("[lab] Couldn't load experiments from Sanity, using defaults:", error);
    return DEFAULT_LAB_ITEMS;
  }
}

/** Real numbers for the Tests card, from the latest build's test run. */
export interface LabTestStats {
  passed: number;
  total: number;
  /** Percentage of lines covered, when coverage was measured. */
  coverage?: number;
}

/**
 * Reads the test summary captured at build time (`/test-results.json` on the live site), cached for an
 * hour. Returns null if it can't be loaded, and the Tests card then shows no numbers.
 */
export async function getLabTestStats(): Promise<LabTestStats | null> {
  try {
    const res = await fetch(`${SITE_ORIGIN}/test-results.json`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as TestRunResponse;
    if ("error" in data || !data.summary?.total) return null;
    return { passed: data.summary.passed, total: data.summary.total, coverage: data.coverage?.lines };
  } catch {
    return null;
  }
}
