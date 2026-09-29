import { FEATURES, KINDS, STAGES, TEAMS, TIMELINES, USERS_PHRASE, labelOf, type Feature, type ProjectKind, type ScopeAnswers, type Stage, type Timeline } from "./options";

/**
 * The Project Scoping Assistant's estimate rules. Everything here is plain arithmetic on the answers, so
 * the same answers always give the same snapshot (and it's easy to test and tune). Weeks are for one
 * senior developer. AI only rewords the result into a summary; it never changes these numbers.
 */

/** Rough size of the project. */
export type Size = "S" | "M" | "L" | "XL";

/** One line of "What moves the estimate": a reason and how many weeks it adds (or saves). */
export interface Factor {
  label: string;
  weeks: number;
}

/** One phase with its week range. */
export interface Phase {
  name: string;
  min: number;
  max: number;
}

/** A risk worth planning for, with a one-line suggestion. */
export interface Risk {
  title: string;
  advice: string;
}

/** How the estimate compares with the visitor's timeline. */
export type Fit = "fits" | "tight" | "over" | "flexible";

/** The whole snapshot. */
export interface Estimate {
  size: Size;
  /** Week range for one senior developer. */
  min: number;
  max: number;
  factors: Factor[];
  phases: Phase[];
  fit: Fit;
  /** When the timeline is tight or over: features to leave for after the first release. */
  deferrable: string[];
  risks: Risk[];
  /** Suggested tools and approach. */
  approach: string[];
  /** The first three things I'd do. */
  firstSteps: string[];
}

/** Starting point in weeks for each kind of project. */
export const BASE_WEEKS: Record<ProjectKind, number> = { website: 3, webapp: 8, mobile: 10, ai: 5, internal: 6, improve: 4 };

/** Weeks each capability adds. */
export const FEATURE_WEEKS: Record<Feature, number> = {
  accounts: 2,
  payments: 3,
  admin: 2,
  integrations: 3,
  content: 1,
  ai: 4,
  realtime: 3,
  languages: 1,
  sensitive: 3,
};

/** Weeks added or saved by where the project is today (an existing product doesn't save time when improving it). */
const STAGE_WEEKS: Record<Stage, number> = { idea: 2, designs: 0, prototype: -2, live: -1 };
const SCALE_WEEKS = { small: 0, hundreds: 1, thousands: 3, unsure: 1 } as const;
const TEAM_WEEKS = { none: 1, lead: 0, hands: 0 } as const;

/** Most weeks each timeline allows (null = no limit). */
const TIMELINE_WEEKS: Record<Timeline, number | null> = { asap: 4, quarter: 13, half: 26, flexible: null };

/** Size from the middle of the range. */
export function sizeFor(weeks: number): Size {
  if (weeks <= 5) return "S";
  if (weeks <= 12) return "M";
  if (weeks <= 24) return "L";
  return "XL";
}

/** Splits the total into phases (each at least a week), with names that suit the kind of project. */
function phasesFor(kind: ProjectKind, min: number, max: number): Phase[] {
  const names = kind === "improve" ? ["Audit", "Improve", "Release"] : ["Discovery", "Build the first version", "Launch"];
  const shares = [0.15, 0.65, 0.2];
  return names.map((name, i) => ({
    name,
    min: Math.max(1, Math.round(min * shares[i])),
    max: Math.max(1, Math.round(max * shares[i])),
  }));
}

/** Risks from the answers, most important first; the snapshot shows the top three. */
function risksFor(a: ScopeAnswers, fit: Fit): Risk[] {
  const has = (f: Feature) => a.features.includes(f);
  const risks: Risk[] = [];
  if (fit === "over" || fit === "tight")
    risks.push({ title: "Timeline", advice: "Agree on a smaller first release and plan the rest as a second phase." });
  if (has("sensitive"))
    risks.push({ title: "Sensitive data", advice: "Plan a security review and check privacy rules (e.g. GDPR, HIPAA) before building." });
  if (has("payments")) risks.push({ title: "Payments", advice: "Use a proven provider like Stripe and never store card details yourself." });
  if (has("ai") || a.kind === "ai")
    risks.push({ title: "AI quality & cost", advice: "Test answers on real examples in the first week and set usage limits early." });
  if (a.stage === "idea") risks.push({ title: "Unclear scope", advice: "Spend the first week turning the idea into a short list of must-haves." });
  if (has("integrations")) risks.push({ title: "Other people's APIs", advice: "Check the tools' APIs and limits first: they're the most common surprise." });
  if (a.scale === "thousands") risks.push({ title: "Growth", advice: "Load-test before launch and pick hosting that scales without a rewrite." });
  if (a.team === "none") risks.push({ title: "After launch", advice: "Decide early who maintains it: hosting, updates and small fixes." });
  if (has("accounts")) risks.push({ title: "Accounts", advice: "Use a proven login provider rather than building your own." });
  if (a.kind === "improve") risks.push({ title: "Hidden legacy issues", advice: "Start with a short code and performance audit before promising dates." });
  if (!risks.length) risks.push({ title: "Scope creep", advice: "Write down what's out of scope for the first version, and keep to it." });
  return risks;
}

/** Suggested tools for the kind of project and its capabilities. */
function approachFor(a: ScopeAnswers): string[] {
  const has = (f: Feature) => a.features.includes(f);
  const main: Record<ProjectKind, string> = {
    website: "Next.js site on Vercel: fast, search-friendly and cheap to host",
    webapp: "Next.js + TypeScript web app on Vercel, with a managed database",
    mobile: "React Native (one codebase for iPhone and Android), sharing logic with a web back end",
    ai: "An AI model behind your own API, with prompts, limits and fallbacks you control",
    internal: "A Next.js internal app with a managed database and single sign-on",
    improve: "Keep your current stack; improve it step by step, backed by tests",
  };
  const list = [main[a.kind]];
  if (has("content") || a.kind === "website") list.push("A content system like Sanity so you can edit pages yourself");
  if (has("accounts")) list.push("A login provider (e.g. Clerk or Auth0) instead of custom auth");
  if (has("payments")) list.push("Stripe for payments and invoices");
  if (has("ai") && a.kind !== "ai") list.push("An AI API (Gemini, Claude or OpenAI) called only from the server");
  if (has("realtime")) list.push("A real-time service for live updates and notifications");
  list.push("Automated tests and previews for every change from day one");
  return list;
}

/** The first three steps, depending on where the project is today. */
function firstStepsFor(a: ScopeAnswers): string[] {
  const steps: Record<Stage, string[]> = {
    idea: ["List the 3–5 things a first version must do", "Sketch the main screens and test them with 2–3 users", "Pick the stack and set up a live preview"],
    designs: ["Review the designs for gaps and edge cases", "Split the work into small releases", "Set up the project, hosting and tests"],
    prototype: ["Review the prototype's code and decide what to keep", "Fix the riskiest parts first", "Plan the path from prototype to a stable first release"],
    live: ["Audit code, performance and analytics", "Agree on the top 3 improvements", "Ship the first one within two weeks"],
  };
  return steps[a.stage];
}

/** Works out the snapshot for a set of answers. */
export function estimate(a: ScopeAnswers): Estimate {
  const factors: Factor[] = [{ label: `${labelOf(KINDS, a.kind)} (starting point)`, weeks: BASE_WEEKS[a.kind] }];
  for (const f of a.features) {
    // The AI work is already part of an AI project's starting point
    const weeks = f === "ai" && a.kind === "ai" ? 0 : FEATURE_WEEKS[f];
    if (weeks) factors.push({ label: labelOf(FEATURES, f), weeks });
  }
  const stageWeeks = a.kind === "improve" && a.stage === "live" ? 0 : STAGE_WEEKS[a.stage];
  if (stageWeeks) factors.push({ label: stageWeeks > 0 ? "Starting from an idea (more discovery)" : `Starting from ${labelOf(STAGES, a.stage).toLowerCase()}`, weeks: stageWeeks });
  if (SCALE_WEEKS[a.scale]) {
    const phrase = USERS_PHRASE[a.scale];
    factors.push({ label: phrase.charAt(0).toUpperCase() + phrase.slice(1), weeks: SCALE_WEEKS[a.scale] });
  }
  if (TEAM_WEEKS[a.team]) factors.push({ label: `${labelOf(TEAMS, a.team)} (hosting, handover)`, weeks: TEAM_WEEKS[a.team] });

  const total = Math.max(2, factors.reduce((sum, f) => sum + f.weeks, 0));
  const min = Math.max(1, Math.round(total * 0.8));
  const max = Math.max(min + 1, Math.round(total * 1.3));

  const limit = TIMELINE_WEEKS[a.timeline];
  const fit: Fit = limit === null ? "flexible" : max <= limit ? "fits" : min <= limit ? "tight" : "over";
  // Biggest optional capabilities first: what to leave for a second release
  const deferrable =
    fit === "tight" || fit === "over"
      ? [...a.features]
          .filter((f) => f !== "sensitive" && f !== "accounts")
          .sort((x, y) => FEATURE_WEEKS[y] - FEATURE_WEEKS[x])
          .slice(0, 2)
          .map((f) => labelOf(FEATURES, f))
      : [];

  return {
    size: sizeFor((min + max) / 2),
    min,
    max,
    factors,
    phases: phasesFor(a.kind, min, max),
    fit,
    deferrable,
    risks: risksFor(a, fit).slice(0, 3),
    approach: approachFor(a),
    firstSteps: firstStepsFor(a),
  };
}

/** Short sentence about the timeline fit. */
export function fitText(fit: Fit, timeline: Timeline): string {
  const t = labelOf(TIMELINES, timeline).toLowerCase();
  if (fit === "fits") return `Fits your ${t} timeline.`;
  if (fit === "tight") return `Tight for ${t}: doable with a smaller first release.`;
  if (fit === "over") return `Longer than ${t}: plan a smaller first release.`;
  return "Your timeline is flexible.";
}

/** Plain-language size, e.g. "medium". */
export const SIZE_WORDS: Record<Size, string> = { S: "small", M: "medium", L: "large", XL: "very large" };

/**
 * The summary written without AI (also used when the AI is busy or its answer can't be used): two or
 * three sentences built only from the estimate.
 */
export function templateSummary(a: ScopeAnswers, e: Estimate): string {
  const what = labelOf(KINDS, a.kind).toLowerCase();
  const fit = e.fit === "fits" || e.fit === "flexible" ? "" : " I'd suggest a smaller first release to meet your timeline.";
  const top = e.risks[0];
  const risk = top ? ` The main thing to plan for is ${top.title.replace(/^[A-Z][a-z]/, (m) => m.toLowerCase())}: ${top.advice.charAt(0).toLowerCase()}${top.advice.slice(1)}` : "";
  return `This looks like a ${SIZE_WORDS[e.size]} ${what} project, roughly ${e.min}–${e.max} weeks for one senior developer.${fit}${risk}`;
}

/** Plain-text version of the snapshot for the booking notes, so the call starts with the context. */
export function bookingNotes(a: ScopeAnswers, e: Estimate): string {
  const features = a.features.map((f) => labelOf(FEATURES, f)).join(", ") || "none selected";
  return [
    `Project scoping snapshot: ${labelOf(KINDS, a.kind)}, ${labelOf(STAGES, a.stage).toLowerCase()}, ${USERS_PHRASE[a.scale]}.`,
    `Needs: ${features}. Team: ${labelOf(TEAMS, a.team)}. Timeline: ${labelOf(TIMELINES, a.timeline)}.`,
    `Estimate: ${e.size}, ${e.min}–${e.max} weeks. Top risks: ${e.risks.map((r) => r.title).join(", ")}.`,
  ].join("\n");
}
