/**
 * Questions and answer types for the Project Scoping Assistant (/scope), plus helpers to check answers
 * and to save them in the page link so a snapshot can be shared.
 */

/** What the visitor wants to build. */
export type ProjectKind = "website" | "webapp" | "mobile" | "ai" | "internal" | "improve";
/** How far along it is. */
export type Stage = "idea" | "designs" | "prototype" | "live";
/** Expected number of users. */
export type Scale = "small" | "hundreds" | "thousands" | "unsure";
/** Capabilities it needs (any number). */
export type Feature = "accounts" | "payments" | "admin" | "integrations" | "content" | "ai" | "realtime" | "languages" | "sensitive";
/** Who's on their side. */
export type Team = "none" | "lead" | "hands";
/** When they need it. */
export type Timeline = "asap" | "quarter" | "half" | "flexible";
/** Budget range (optional; only passed along, never used to change the estimate). */
export type Budget = "small" | "medium" | "large" | "xl" | "skip";

/** Everything the visitor answered. */
export interface ScopeAnswers {
  kind: ProjectKind;
  stage: Stage;
  scale: Scale;
  features: Feature[];
  team: Team;
  timeline: Timeline;
  budget: Budget;
  /** Optional free text, at most NOTES_MAX characters. */
  notes?: string;
}

/** One choice in a question. */
export interface Choice<T extends string> {
  id: T;
  label: string;
  /** Small grey hint under or next to the label. */
  hint?: string;
}

/** One screen of the wizard. */
export interface Question<K extends keyof ScopeAnswers = keyof ScopeAnswers> {
  key: K;
  title: string;
  help?: string;
  /** True when several choices can be picked. */
  multiple?: boolean;
  /** True when it can be skipped. */
  optional?: boolean;
  choices: Choice<string>[];
}

export const NOTES_MAX = 500;

export const KINDS: Choice<ProjectKind>[] = [
  { id: "website", label: "Website", hint: "marketing site, portfolio, blog" },
  { id: "webapp", label: "Web app", hint: "people sign in and get things done" },
  { id: "mobile", label: "Mobile app", hint: "iPhone and Android" },
  { id: "ai", label: "AI feature or automation", hint: "chat, summaries, workflows" },
  { id: "internal", label: "Internal tool", hint: "dashboards, back-office" },
  { id: "improve", label: "Improve an existing product", hint: "faster, cleaner, new features" },
];

export const STAGES: Choice<Stage>[] = [
  { id: "idea", label: "Just an idea" },
  { id: "designs", label: "Designs or specs" },
  { id: "prototype", label: "A prototype" },
  { id: "live", label: "A live product" },
];

export const SCALES: Choice<Scale>[] = [
  { id: "small", label: "Fewer than 50", hint: "a team or a pilot" },
  { id: "hundreds", label: "Hundreds" },
  { id: "thousands", label: "Thousands or more" },
  { id: "unsure", label: "Not sure yet" },
];

export const FEATURES: Choice<Feature>[] = [
  { id: "accounts", label: "User accounts & login" },
  { id: "payments", label: "Payments" },
  { id: "admin", label: "Admin dashboard" },
  { id: "integrations", label: "Connect to other tools", hint: "CRM, email, APIs" },
  { id: "content", label: "Content I can edit" },
  { id: "ai", label: "AI features", hint: "chat, summaries" },
  { id: "realtime", label: "Real-time updates", hint: "live data, notifications" },
  { id: "languages", label: "Multiple languages" },
  { id: "sensitive", label: "Sensitive data", hint: "health, finance" },
];

export const TEAMS: Choice<Team>[] = [
  { id: "none", label: "No tech team", hint: "I need someone to build it" },
  { id: "lead", label: "Developers who need leadership", hint: "architecture, reviews, direction" },
  { id: "hands", label: "A team that needs extra hands" },
];

export const TIMELINES: Choice<Timeline>[] = [
  { id: "asap", label: "Within a month" },
  { id: "quarter", label: "1–3 months" },
  { id: "half", label: "3–6 months" },
  { id: "flexible", label: "Flexible" },
];

export const BUDGETS: Choice<Budget>[] = [
  { id: "small", label: "Under $10k" },
  { id: "medium", label: "$10k–$30k" },
  { id: "large", label: "$30k–$75k" },
  { id: "xl", label: "$75k+" },
  { id: "skip", label: "Prefer not to say" },
];

/** The wizard's questions, in order. */
export const QUESTIONS: Question[] = [
  { key: "kind", title: "What are you building?", choices: KINDS },
  { key: "stage", title: "Where is it today?", choices: STAGES },
  { key: "scale", title: "How many people will use it?", choices: SCALES },
  { key: "features", title: "What does it need to do?", help: "Pick all that apply, or none.", multiple: true, choices: FEATURES },
  { key: "team", title: "What does your team look like?", choices: TEAMS },
  { key: "timeline", title: "When do you need it?", choices: TIMELINES },
  { key: "budget", title: "Do you have a budget in mind?", help: "Optional. It doesn't change the estimate.", optional: true, choices: BUDGETS },
];

/** How many users, as a phrase for sentences ("hundreds of users"). */
export const USERS_PHRASE: Record<Scale, string> = {
  small: "fewer than 50 users",
  hundreds: "hundreds of users",
  thousands: "thousands of users",
  unsure: "user numbers not known yet",
};

/** Label of a choice, for summaries and notes. */
export function labelOf(choices: Choice<string>[], id: string): string {
  return choices.find((c) => c.id === id)?.label ?? id;
}

/** The ids of a list of choices. */
const ids = <T extends string>(choices: Choice<T>[]) => choices.map((c) => c.id) as string[];
/** True if `value` is one of the choices' ids. */
const oneOf = <T extends string>(choices: Choice<T>[], value: unknown): value is T => typeof value === "string" && ids(choices).includes(value);

/** Cleans free text: trims, collapses whitespace, drops control characters and cuts it to NOTES_MAX. */
export function cleanNotes(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, NOTES_MAX);
}

/**
 * Checks answers sent by the page (or read from a link). Returns null if a required answer is missing
 * or not one of the choices; unknown features are dropped, duplicates removed, budget defaults to "skip".
 */
export function parseAnswers(body: unknown): ScopeAnswers | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!oneOf(KINDS, b.kind) || !oneOf(STAGES, b.stage) || !oneOf(SCALES, b.scale) || !oneOf(TEAMS, b.team) || !oneOf(TIMELINES, b.timeline)) {
    return null;
  }
  const features = Array.isArray(b.features) ? [...new Set(b.features.filter((f): f is Feature => oneOf(FEATURES, f)))] : [];
  // Keep features in the list's order, so the same answers always look (and cache) the same
  features.sort((x, y) => ids(FEATURES).indexOf(x) - ids(FEATURES).indexOf(y));
  const notes = cleanNotes(b.notes);
  return {
    kind: b.kind,
    stage: b.stage,
    scale: b.scale,
    features,
    team: b.team,
    timeline: b.timeline,
    budget: oneOf(BUDGETS, b.budget) ? b.budget : "skip",
    ...(notes ? { notes } : {}),
  };
}

/**
 * Turns answers into a short link fragment, e.g. "k=webapp&s=prototype&u=hundreds&f=accounts,ai&t=lead&w=half&b=skip".
 * The free-text notes are left out on purpose, so shared links never carry what someone typed.
 */
export function encodeAnswers(a: ScopeAnswers): string {
  const params = new URLSearchParams({ k: a.kind, s: a.stage, u: a.scale, f: a.features.join(","), t: a.team, w: a.timeline, b: a.budget });
  return params.toString();
}

/** Reads answers back from a link fragment (with or without the leading "#"). Returns null if incomplete. */
export function decodeAnswers(hash: string): ScopeAnswers | null {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  return parseAnswers({
    kind: p.get("k"),
    stage: p.get("s"),
    scale: p.get("u"),
    features: (p.get("f") ?? "").split(",").filter(Boolean),
    team: p.get("t"),
    timeline: p.get("w"),
    budget: p.get("b"),
  });
}
