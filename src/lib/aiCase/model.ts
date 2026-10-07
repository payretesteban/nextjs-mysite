/**
 * Cost model for the AI cost demo case (/ai-cost-case): a fictional company's AI workflows before and
 * after a redesign. Every number on the page comes from here, from the visitor's inputs and the stated
 * assumptions below, so the maths is open. These are illustrative figures, not measurements or real
 * vendor prices.
 */

/** What the visitor can change in "Try your numbers". */
export interface CaseInputs {
  /** Customer and contact records across the tools. */
  records: number;
  /** Percent of records that change on a typical day. */
  changeRate: number;
  /** How often the old sync agent runs. */
  syncsPerDay: number;
  /** Leadership reports per week. */
  reportsPerWeek: number;
}

export const DEFAULT_INPUTS: CaseInputs = { records: 40_000, changeRate: 2, syncsPerDay: 96, reportsPerWeek: 1 };

/** Slider ranges for the calculator. */
export const INPUT_LIMITS = {
  records: { min: 5_000, max: 200_000, step: 5_000 },
  changeRate: { min: 0.5, max: 10, step: 0.5 },
  syncsPerDay: { min: 24, max: 288, step: 24 },
  reportsPerWeek: { min: 1, max: 7, step: 1 },
} as const;

/** Illustrative prices in US dollars per million tokens (not any vendor's real price list). */
export const PRICES = {
  large: { input: 5, output: 25 },
  small: { input: 1, output: 5 },
  /** Cached prompt tokens cost this share of the normal input price. */
  cachedShare: 0.1,
  /** Batch jobs (results within hours, not seconds) cost this share of the normal price. */
  batchShare: 0.5,
} as const;

/** Everything else the model assumes, shown on the page under "Assumptions". */
export const ASSUMPTIONS = {
  daysPerMonth: 30,
  weeksPerMonth: 4.33,
  /** System prompt + tool definitions an agent receives on every run. */
  agentPromptTokens: 6_000,
  /** Records the old sync agent reads each run to find what changed, and their size. */
  scannedRecordsPerRun: 500,
  tokensPerScannedRecord: 60,
  /** Full record from three tools + the agent's reasoning, per changed record. */
  tokensPerChange: 1_200,
  outputPerChange: 300,
  /** Old enrichment: every record re-summarized once a week. */
  enrichInput: 800,
  enrichOutput: 150,
  /** Old content agent: product pages rewritten whenever stock changes. */
  contentRewritesPerDay: 100,
  contentInput: 3_000,
  contentOutput: 800,
  /** Raw export size per record, plus a fixed part (campaigns, products…). */
  exportTokensPerRecord: 12,
  exportFixedTokens: 20_000,
  /** One report step per tool; each step carries all earlier exports forward. */
  reportSteps: 5,
  reportOutput: 4_000,
  /** Average extra attempts from timeouts and failed runs. */
  retryFactor: 1.3,
  /** New: share of changed records that are new leads or tickets needing triage. */
  triageShare: 0.15,
  triagePromptTokens: 1_500,
  triageInput: 400,
  triageOutput: 60,
  /** New: summary refreshed only for records that changed, as a batch job. */
  newEnrichInput: 600,
  newEnrichOutput: 120,
  /** New: AI drafts copy only for new products, then a person approves it. */
  newProductsPerMonth: 20,
  draftInput: 2_000,
  draftOutput: 600,
  /** New: the report story gets a small summary of numbers already calculated in SQL. */
  narrativeInput: 3_000,
  narrativeOutput: 900,
} as const;

export type WorkflowId = "sync" | "triage" | "enrich" | "content" | "report";
export type ModelSize = "large" | "small" | "none";

/** One workflow's monthly AI usage in a scenario. */
export interface WorkflowUsage {
  id: WorkflowId;
  /** Which model it uses; "none" when no AI is involved. */
  model: ModelSize;
  inputTokens: number;
  outputTokens: number;
  /** US dollars per month. */
  cost: number;
}

/** A whole scenario (before or after). */
export interface Scenario {
  workflows: WorkflowUsage[];
  tokens: number;
  cost: number;
  /** How long one leadership report takes to produce. */
  reportSeconds: number;
  /** Longest wait before a change in one tool shows up in the others. */
  syncDelaySeconds: number;
}

/** Before vs after for one set of inputs. */
export interface Comparison {
  before: Scenario;
  after: Scenario;
  /** Percent fewer tokens / dollars after the redesign (0–100). */
  tokenSaving: number;
  costSaving: number;
}

export const WORKFLOW_LABELS: Record<WorkflowId, string> = {
  sync: "Data sync",
  triage: "Lead & ticket triage",
  enrich: "Contact summaries",
  content: "Product copy",
  report: "Weekly report",
};

/**
 * Monthly cost in dollars.
 * @param cachedInput - Input tokens served from the prompt cache (charged at PRICES.cachedShare).
 */
function price(model: ModelSize, input: number, output: number, { cachedInput = 0, batch = false } = {}): number {
  if (model === "none") return 0;
  const p = PRICES[model];
  const dollars = ((input - cachedInput) * p.input + cachedInput * p.input * PRICES.cachedShare + output * p.output) / 1_000_000;
  return batch ? dollars * PRICES.batchShare : dollars;
}

/** Builds one workflow's usage. */
function usage(id: WorkflowId, model: ModelSize, input: number, output: number, options?: { cachedInput?: number; batch?: boolean }): WorkflowUsage {
  return { id, model, inputTokens: Math.round(input), outputTokens: Math.round(output), cost: price(model, input, output, options) };
}

/** Adds up a scenario's workflows. */
function scenario(workflows: WorkflowUsage[], reportSeconds: number, syncDelaySeconds: number): Scenario {
  return {
    workflows,
    tokens: workflows.reduce((sum, w) => sum + w.inputTokens + w.outputTokens, 0),
    cost: workflows.reduce((sum, w) => sum + w.cost, 0),
    reportSeconds,
    syncDelaySeconds,
  };
}

/** Records that change per day. */
const changesPerDay = (i: CaseInputs) => (i.records * i.changeRate) / 100;

/** Agents everywhere: the largest model moves data, re-summarizes everyone and does the report's arithmetic. */
export function beforeScenario(i: CaseInputs): Scenario {
  const a = ASSUMPTIONS;
  const changes = changesPerDay(i) * a.daysPerMonth;
  const syncRuns = i.syncsPerDay * a.daysPerMonth;
  const syncInput = syncRuns * (a.agentPromptTokens + a.scannedRecordsPerRun * a.tokensPerScannedRecord) + changes * a.tokensPerChange;

  const enrichRuns = i.records * a.weeksPerMonth;
  const rewrites = a.contentRewritesPerDay * a.daysPerMonth;

  // Each step re-reads everything gathered so far: 1/5 + 2/5 + … + 5/5 = 3× the full export
  const exportTokens = i.records * a.exportTokensPerRecord + a.exportFixedTokens;
  const carried = (exportTokens * (a.reportSteps + 1)) / 2;
  const reports = i.reportsPerWeek * a.weeksPerMonth;
  const reportInput = reports * a.retryFactor * (carried + a.reportSteps * a.agentPromptTokens);

  return scenario(
    [
      usage("sync", "large", syncInput, changes * a.outputPerChange),
      // Triage happened inside the sync agent, so it has no cost of its own here
      usage("triage", "none", 0, 0),
      usage("enrich", "large", enrichRuns * a.enrichInput, enrichRuns * a.enrichOutput),
      usage("content", "large", rewrites * a.contentInput, rewrites * a.contentOutput),
      usage("report", "large", reportInput, reports * a.retryFactor * a.reportOutput),
    ],
    // Reading big exports step by step: about 6 minutes plus 1 minute per 2,000 records
    360 + i.records * 0.03,
    // A change waits for the next run, then the run itself takes about a minute
    (24 * 3600) / i.syncsPerDay + 60
  );
}

/** Lean flow: plain code moves the data, SQL does the maths, small models do the judgment calls. */
export function afterScenario(i: CaseInputs): Scenario {
  const a = ASSUMPTIONS;
  const changes = changesPerDay(i) * a.daysPerMonth;
  const triaged = changes * a.triageShare;
  const reports = i.reportsPerWeek * a.weeksPerMonth;

  return scenario(
    [
      usage("sync", "none", 0, 0),
      usage("triage", "small", triaged * (a.triagePromptTokens + a.triageInput), triaged * a.triageOutput, { cachedInput: triaged * a.triagePromptTokens }),
      usage("enrich", "small", changes * a.newEnrichInput, changes * a.newEnrichOutput, { batch: true }),
      usage("content", "large", a.newProductsPerMonth * a.draftInput, a.newProductsPerMonth * a.draftOutput),
      usage("report", "large", reports * a.narrativeInput, reports * a.narrativeOutput),
    ],
    // SQL in a few seconds plus about half a minute to write the story
    40,
    // Webhooks: a few seconds
    5
  );
}

/** Percent saved going from `before` to `after`, 0 when there was nothing to save. */
const saving = (before: number, after: number) => (before > 0 ? Math.max(0, (1 - after / before) * 100) : 0);

/** Both scenarios for the same inputs, plus how much the redesign saves. */
export function compare(i: CaseInputs): Comparison {
  const before = beforeScenario(i);
  const after = afterScenario(i);
  return { before, after, tokenSaving: saving(before.tokens, after.tokens), costSaving: saving(before.cost, after.cost) };
}

/** Keeps inputs inside the slider ranges (and on whole steps), e.g. for values typed into a link. */
export function clampInputs(i: Partial<Record<keyof CaseInputs, unknown>>): CaseInputs {
  const pick = (key: keyof CaseInputs) => {
    const { min, max, step } = INPUT_LIMITS[key];
    const n = Number(i[key]);
    if (!Number.isFinite(n)) return DEFAULT_INPUTS[key];
    return Math.min(max, Math.max(min, Math.round(n / step) * step));
  };
  return { records: pick("records"), changeRate: pick("changeRate"), syncsPerDay: pick("syncsPerDay"), reportsPerWeek: pick("reportsPerWeek") };
}

/** Tokens in short form: 950, 12k, 4.8M, 1.2B. */
export function formatTokens(n: number): string {
  const short = (v: number, unit: string) => `${v >= 100 ? Math.round(v) : Number(v.toFixed(1))}${unit}`;
  if (n >= 1e9) return short(n / 1e9, "B");
  if (n >= 1e6) return short(n / 1e6, "M");
  if (n >= 1e3) return short(n / 1e3, "k");
  return String(Math.round(n));
}

/** Dollars: "$2,340" from $100 up, "$42" from $10, "$4.20" below, "$0" for nothing. */
export function formatMoney(n: number): string {
  if (n <= 0) return "$0";
  if (n < 10) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** Durations: "5 s", "40 s", "2 min", "26 min", "1.5 h". */
export function formatDuration(seconds: number): string {
  if (seconds < 90) return `${Math.round(seconds)} s`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${Math.round(minutes)} min`;
  return `${Number((minutes / 60).toFixed(1))} h`;
}
