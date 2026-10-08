"use client";

import { WORKFLOW_CHANGES } from "@/lib/aiCase/flow";
import { DEFAULT_INPUTS, INPUT_LIMITS, WORKFLOW_LABELS, formatMoney, formatTokens, type CaseInputs } from "@/lib/aiCase/model";
import { useCase } from "./CaseContext";

/** "Where the money went": the old monthly AI bill split by workflow, biggest first. */
export function CostBreakdown() {
  const { result } = useCase();
  const rows = result.before.workflows.filter((w) => w.cost > 0).sort((a, b) => b.cost - a.cost);
  const total = result.before.cost;
  return (
    <ul className="space-y-2.5" aria-label="Monthly AI cost before, by workflow">
      {rows.map((w) => {
        const share = total > 0 ? (w.cost / total) * 100 : 0;
        return (
          <li key={w.id} className="grid grid-cols-[8.5rem_1fr] items-center gap-3 text-sm sm:grid-cols-[10rem_1fr]">
            <span className="text-slate-700 dark:text-slate-300">{WORKFLOW_LABELS[w.id]}</span>
            <span className="flex items-center gap-2">
              <span className="h-3 rounded bg-rose-400 dark:bg-rose-500" style={{ width: `${Math.max(1, share * 0.7)}%` }} aria-hidden="true" />
              <span className="whitespace-nowrap font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                {formatMoney(w.cost)} · {Math.round(share)}%
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** "What changed, box by box": each workflow before and after, with its monthly tokens. */
export function ChangesTable() {
  const { result } = useCase();
  return (
    // "relative" keeps the screen-reader-only text inside the scroll box (it would widen the page otherwise)
    <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Workflows before and after (scrolls sideways on small screens)">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">Each workflow before and after the redesign, with tokens per month</caption>
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-400">
            <th scope="col" className="py-2 pr-3 font-semibold">Workflow</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Before</th>
            <th scope="col" className="py-2 pr-3 font-semibold">After</th>
            <th scope="col" className="py-2 text-right font-semibold">Tokens / month</th>
          </tr>
        </thead>
        <tbody>
          {result.before.workflows.map((b) => {
            const a = result.after.workflows.find((w) => w.id === b.id)!;
            return (
              <tr key={b.id} className="border-b border-slate-100 align-top dark:border-slate-800">
                <th scope="row" className="py-2.5 pr-3 font-semibold text-slate-900 dark:text-slate-100">{WORKFLOW_LABELS[b.id]}</th>
                <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{WORKFLOW_CHANGES[b.id].before}</td>
                <td className="py-2.5 pr-3 text-slate-800 dark:text-slate-200">{WORKFLOW_CHANGES[b.id].after}</td>
                <td className="whitespace-nowrap py-2.5 text-right font-mono text-xs tabular-nums">
                  <span className="text-rose-700 dark:text-rose-400">{b.inputTokens + b.outputTokens ? formatTokens(b.inputTokens + b.outputTokens) : "—"}</span>
                  <span className="text-slate-500 dark:text-slate-400" aria-hidden="true"> → </span>
                  <span className="sr-only"> to </span>
                  <span className="text-emerald-700 dark:text-emerald-400">{formatTokens(a.inputTokens + a.outputTokens)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Slider settings for the calculator. */
const SLIDERS: { key: keyof CaseInputs; label: string; format: (v: number) => string }[] = [
  { key: "records", label: "Customer records", format: (v) => v.toLocaleString("en-US") },
  { key: "changeRate", label: "Records that change each day", format: (v) => `${v}%` },
  { key: "syncsPerDay", label: "Old sync agent runs per day", format: (v) => `${v} (every ${Math.round((24 * 60) / v)} min)` },
  { key: "reportsPerWeek", label: "Reports per week", format: (v) => String(v) },
];

/** "Try your numbers": sliders for the company's size and habits, with both monthly bills side by side. */
export function Calculator() {
  const { inputs, setInputs, result } = useCase();
  const changed = SLIDERS.some(({ key }) => inputs[key] !== DEFAULT_INPUTS[key]);

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_15rem]">
      <div className="space-y-4">
        {SLIDERS.map(({ key, label, format }) => {
          const { min, max, step } = INPUT_LIMITS[key];
          const id = `case-${key}`;
          return (
            <div key={key}>
              <label htmlFor={id} className="flex justify-between gap-3 text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
                <output htmlFor={id} className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  {format(inputs[key])}
                </output>
              </label>
              <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={inputs[key]}
                onChange={(e) => setInputs({ ...inputs, [key]: Number(e.target.value) })}
                className="mt-1.5 w-full cursor-pointer accent-sky-700"
              />
            </div>
          );
        })}
        {changed && (
          <button
            type="button"
            onClick={() => setInputs(DEFAULT_INPUTS)}
            className="text-sm font-semibold text-sky-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-sky-300"
          >
            Reset to Brightline Home
          </button>
        )}
      </div>

      <div aria-live="polite" className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">AI bill per month</p>
        <dl className="mt-2 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Before</dt>
            <dd className="font-mono font-semibold tabular-nums text-rose-700 dark:text-rose-400">{formatMoney(result.before.cost)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>After</dt>
            <dd className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{formatMoney(result.after.cost)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
            <dt>Saved a year</dt>
            <dd className="font-mono font-semibold tabular-nums">{formatMoney((result.before.cost - result.after.cost) * 12)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {Math.round(result.tokenSaving)}% fewer tokens ({formatTokens(result.before.tokens)} → {formatTokens(result.after.tokens)}). The diagram and tables above use these numbers too.
        </p>
      </div>
    </div>
  );
}
