import type { Metadata } from "next";
import Link from "next/link";
import { Animated } from "@/lib/animations";
import { getConsultation } from "@/lib/consultation";
import { ASSUMPTIONS, PRICES } from "@/lib/aiCase/model";
import BookButton from "../consultation/BookButton";
import { CaseProvider } from "./CaseContext";
import { Calculator, ChangesTable, CostBreakdown } from "./CaseNumbers";
import FlowExplorer from "./FlowExplorer";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AI Cost Case: From Agent Sprawl to a Lean AI Flow",
  description:
    "A demo case: a fictional company wired AI agents between its CRM, CMS, marketing suite, store and help desk. See where the tokens went and how a leaner design gets the same results for a fraction of the cost.",
};

const TOOLS = ["CRM", "CMS", "Marketing suite", "Store & billing", "Help desk"];

const STEPS = [
  { title: "Move data with code, not models.", text: "Each tool sends a webhook when something changes and plain mapping code copies it across: zero tokens, seconds instead of minutes, the same result every time." },
  { title: "One source of truth.", text: "Everything lands in one warehouse with a defined structure. Metrics are calculated once in SQL, so revenue is the same number in every report." },
  { title: "Right-size the AI.", text: "A small model for triage and summaries, a large one only for the report's story. Cached instructions, overnight batches for anything not urgent, and only changed records are sent." },
  { title: "Add guardrails.", text: "A monthly budget per workflow, tokens and cost logged for every run, a small test set so a model swap can't quietly make things worse, and a person approving anything customers see." },
];

/** Section heading with a small monospace step number. */
function Heading({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-baseline gap-3 text-2xl font-bold">
      <span className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400">{n}</span>
      {children}
    </h2>
  );
}

/** Prices and assumptions behind every number on the page. */
function Assumptions() {
  const a = ASSUMPTIONS;
  const rows: [string, string][] = [
    ["Large model", `$${PRICES.large.input} in / $${PRICES.large.output} out per million tokens`],
    ["Small model", `$${PRICES.small.input} in / $${PRICES.small.output} out per million tokens`],
    ["Cached instructions, batch jobs", `${PRICES.cachedShare * 100}% and ${PRICES.batchShare * 100}% of the normal price`],
    ["Old agents' instructions + tools", `${a.agentPromptTokens.toLocaleString("en-US")} tokens per run`],
    ["Old sync agent", `scans ${a.scannedRecordsPerRun} records per run, ${a.tokensPerChange.toLocaleString("en-US")} tokens per changed record`],
    ["Old enrichment", `every record weekly, ${a.enrichInput} tokens in / ${a.enrichOutput} out`],
    ["Old content agent", `${a.contentRewritesPerDay} product rewrites a day`],
    ["Old report", `${a.reportSteps} steps carrying the exports forward (${a.exportTokensPerRecord} tokens per record), ×${a.retryFactor} for retries`],
    ["New triage", `${a.triageShare * 100}% of changes are new leads or tickets`],
    ["New report story", `${a.narrativeInput.toLocaleString("en-US")} tokens in / ${a.narrativeOutput} out`],
  ];
  return (
    <details className="group mt-6 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
      <summary className="font-semibold text-slate-800 dark:text-slate-200">Assumptions behind the numbers</summary>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Illustrative prices, not any vendor&apos;s real price list. The point is the ratio, which holds across providers.</p>
      <dl className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-[14rem_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-medium text-slate-700 dark:text-slate-300">{k}</dt>
            <dd className="text-slate-600 dark:text-slate-400">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/**
 * /ai-cost-case: a demo case study about optimizing a fictional company's AI tooling. Intro, the
 * interactive before/after diagram, where the money went, the redesign, a box-by-box table, a sample
 * report, the calculator and a consultation offer. All numbers come from `src/lib/aiCase/model.ts`.
 */
export default async function AiCostCasePage() {
  const consultation = await getConsultation();
  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      <CaseProvider>
        <section className="mb-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-400">Lab · Demo case</p>
          <h1 className="mt-2 text-4xl font-bold">
            <Animated>Same results, a fraction of the AI bill</Animated>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            An example of how I review and redesign a company&apos;s AI tooling. Brightline Home is a fictional 60-person online store that wired AI agents between
            every tool it uses. Switch between before and after to see where the tokens went.
          </p>
          <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900">
            Fictional company · modelled numbers you can change below
          </p>
        </section>

        <FlowExplorer />

        <section className="mt-14">
          <Heading n="01">The company</Heading>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Brightline Home sells home goods online. Like most companies its size, it runs on a handful of tools, and leadership wants one weekly report: revenue,
            campaign return, sales pipeline and support trends.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tools">
            {TOOLS.map((t) => (
              <li key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            A year ago they &ldquo;added AI&rdquo; by putting a large-model agent between every pair of tools. It worked, until the bill, the delays and the
            weekly revenue figure that never quite matched started to hurt.
          </p>
        </section>

        <section className="mt-14">
          <Heading n="02">Where the money went</Heading>
          <p className="mt-3 mb-5 text-slate-600 dark:text-slate-400">
            Most of the bill came from work that never needed a model: copying data and re-summarizing records that hadn&apos;t changed.
          </p>
          <CostBreakdown />
        </section>

        <section className="mt-14">
          <Heading n="03">The redesign</Heading>
          <ol className="mt-5 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
                  {i + 1}
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">{s.title}</strong> {s.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <Heading n="04">What changed, box by box</Heading>
          <div className="mt-5">
            <ChangesTable />
          </div>
        </section>

        <section className="mt-14">
          <Heading n="05">A sample weekly report</Heading>
          <p className="mt-3 mb-4 text-slate-600 dark:text-slate-400">The numbers come from SQL. The AI only writes the story around them, and a check rejects any number it makes up.</p>
          <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-300 sm:text-sm dark:bg-slate-800">
            <p>
              <span className="text-slate-400">SQL · 3 s</span> Revenue <span className="text-emerald-300">$412,380</span> (+6.2% on last week) · Orders 5,318 · Returns 3.1%
            </p>
            <p className="mt-2">
              <span className="text-slate-400">AI · 900 tokens</span> &ldquo;Revenue grew 6.2% to $412,380, mostly from the spring email campaign. Returns held at
              3.1%; the top support topic was delivery times…&rdquo;
            </p>
            <p className="mt-2 text-emerald-300">✓ Every number in the story matches the data</p>
          </div>
        </section>

        <section className="mt-14">
          <Heading n="06">Try your numbers</Heading>
          <p className="mt-3 mb-5 text-slate-600 dark:text-slate-400">Change the company&apos;s size and habits. Everything is calculated in your browser; nothing is sent anywhere.</p>
          <Calculator />
          <Assumptions />
        </section>

        <section className="mt-14 rounded-3xl bg-sky-50 p-6 ring-1 ring-sky-100 sm:p-8 dark:bg-sky-950/40 dark:ring-sky-900">
          <h2 className="text-2xl font-bold">Is your AI stack costing more than it should?</h2>
          <p className="mt-2 max-w-xl text-slate-700 dark:text-slate-300">
            In a free 30-minute call we can look at your tools and AI workflows and find where plain code, a smaller model or caching would do the job.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <BookButton bookingUrl={consultation.bookingUrl} label={consultation.buttonLabel} notes="From the AI cost demo case: I'd like to review our AI workflows and costs." />
            <Link
              href="/scope"
              className="text-sm font-semibold text-sky-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-sky-300"
            >
              Or scope a project first →
            </Link>
          </div>
        </section>
      </CaseProvider>
    </div>
  );
}
