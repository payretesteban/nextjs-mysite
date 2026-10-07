"use client";

import { useRef, useState } from "react";
import { useAnimation } from "@/app/context/AnimationContext";
import { DEFAULT_SELECTED, FLOW_EDGES, FLOW_HEIGHT, FLOW_NODES, FLOW_WIDTH, NODE_DETAILS, type FlowNode, type Mode } from "@/lib/aiCase/flow";
import { WORKFLOW_LABELS, formatDuration, formatMoney, formatTokens, type Scenario } from "@/lib/aiCase/model";
import { useCase } from "./CaseContext";

const byId = new Map(FLOW_NODES.map((n) => [n.id, n]));

/** Colours of a box by kind (and whether it's selected). */
function nodeClasses(node: FlowNode, selected: boolean): string {
  const base = "absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border px-1.5 py-1 text-[10px] font-semibold shadow-sm transition sm:px-2.5 sm:text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
  const ring = selected ? " ring-2 ring-offset-1 ring-sky-600 dark:ring-sky-400 dark:ring-offset-slate-900" : " hover:-translate-y-[55%]";
  const colours = {
    tool: " border-slate-300 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
    agent: " border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
    ai: " border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200",
    store: " border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900",
  }[node.kind];
  return base + colours + ring;
}

/** Little symbol in front of a box's name. */
const ICON: Record<FlowNode["kind"], string> = { tool: "", agent: "🤖 ", ai: "✦ ", store: "▤ " };

/** One stat tile; after the redesign it also shows the old value, struck through. */
function Stat({ label, value, was, good }: { label: string; value: string; was?: string; good: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className={`text-xl font-bold tabular-nums sm:text-2xl ${good ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>{value}</div>
      <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
        {label}
        {was && (
          <>
            {" "}
            <span className="sr-only">(was </span>
            <s className="tabular-nums">{was}</s>
            <span className="sr-only">)</span>
          </>
        )}
      </div>
    </div>
  );
}

/** The four headline numbers for a scenario. */
function stats(s: Scenario) {
  return {
    tokens: formatTokens(s.tokens),
    cost: formatMoney(s.cost),
    report: formatDuration(s.reportSeconds),
    sync: formatDuration(s.syncDelaySeconds),
  };
}

/**
 * The page's hero: a Before/After switch, the company's tools and AI steps as a diagram with data moving
 * along the lines (still for reduced-motion visitors, and pausable), a panel explaining the selected box,
 * and the headline numbers.
 */
export default function FlowExplorer() {
  const { result } = useCase();
  const { reducedMotion } = useAnimation();
  const [mode, setMode] = useState<Mode>("before");
  const [selected, setSelected] = useState(DEFAULT_SELECTED.before);
  const [paused, setPaused] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const nodes = FLOW_NODES.filter((n) => n.modes.includes(mode));
  const edges = FLOW_EDGES[mode];
  const node = byId.get(selected)!;
  const scenario = result[mode];
  const workflow = node.workflow ? scenario.workflows.find((w) => w.id === node.workflow) : undefined;
  const before = stats(result.before);
  const now = stats(scenario);
  const after = mode === "after";

  /** Switches diagram and selects that diagram's main box. */
  const show = (next: Mode) => {
    setMode(next);
    setSelected(DEFAULT_SELECTED[next]);
    setPaused(false); // the new diagram's animations start fresh
  };

  /** Pauses or resumes the moving data (SVG animations). */
  const togglePause = () => {
    const svg = svgRef.current;
    if (paused) svg?.unpauseAnimations?.();
    else svg?.pauseAnimations?.();
    setPaused(!paused);
  };

  const path = (from: string, to: string) => {
    const a = byId.get(from)!;
    const b = byId.get(to)!;
    return `M${a.x} ${a.y} L${b.x} ${b.y}`;
  };

  return (
    <section aria-label="The company's AI flow, before and after">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Show the flow" className="inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold dark:bg-slate-800">
          {(["before", "after"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => show(m)}
              className={`rounded-full px-4 py-1.5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                mode === m
                  ? m === "before"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-emerald-700 text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {m === "before" ? "Before · agents everywhere" : "After · lean flow"}
            </button>
          ))}
        </div>
        {!reducedMotion && (
          <button
            type="button"
            onClick={togglePause}
            className="rounded-full px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-300 dark:hover:text-white"
          >
            {paused ? "▶ Play the data" : "❚❚ Pause the data"}
          </button>
        )}
      </div>

      {/* The diagram: lines and moving dots in SVG, boxes as buttons on top */}
      <div
        className={`relative mt-4 aspect-[600/340] w-full rounded-2xl border ${
          after ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-orange-200 bg-orange-50/70 dark:border-orange-900 dark:bg-orange-950/30"
        }`}
      >
        <svg ref={svgRef} viewBox={`0 0 ${FLOW_WIDTH} ${FLOW_HEIGHT}`} className="absolute inset-0 h-full w-full" aria-hidden="true" key={mode}>
          {edges.map(([from, to]) => (
            <path key={`${from}-${to}`} d={path(from, to)} fill="none" strokeWidth={after ? 2 : 1.5} stroke={after ? "#10b981" : "#fb923c"} strokeDasharray={after ? undefined : "5 4"} />
          ))}
          {!reducedMotion &&
            edges.flatMap(([from, to], i) =>
              // Before: lots of traffic back and forth; after: one quiet dot per line
              (after ? [0] : [0, 1, 2]).map((k) => (
                <circle key={`${from}-${to}-${k}`} r={after ? 4 : 3.5} fill={after ? "#059669" : "#f59e0b"}>
                  <animateMotion dur={after ? "2.4s" : `${1.1 + (i % 3) * 0.35}s`} begin={`${-(k * 0.4 + i * 0.17)}s`} repeatCount="indefinite" path={path(from, to)} keyPoints={!after && k === 1 ? "1;0" : "0;1"} keyTimes="0;1" calcMode="linear" />
                </circle>
              ))
            )}
        </svg>
        {nodes.map((n) => (
          <button
            key={n.id}
            type="button"
            aria-pressed={selected === n.id}
            onClick={() => setSelected(n.id)}
            className={nodeClasses(n, selected === n.id)}
            style={{ left: `${(n.x / FLOW_WIDTH) * 100}%`, top: `${(n.y / FLOW_HEIGHT) * 100}%` }}
          >
            <span aria-hidden="true">{ICON[n.kind]}</span>
            {n.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Select any box to see what it does.</p>

      {/* What the selected box does */}
      <div aria-live="polite" className="mt-3 rounded-xl bg-slate-900 p-4 text-sm leading-relaxed text-slate-200 dark:bg-slate-800">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-sky-300">
          {node.label}
          {workflow && <span className="text-slate-400"> · {WORKFLOW_LABELS[workflow.id]}</span>}
        </p>
        <p className="mt-1.5">{NODE_DETAILS[node.id]?.[mode]}</p>
        {workflow && (
          <p className={`mt-2 font-mono text-xs ${after ? "text-emerald-300" : "text-rose-300"}`}>
            {workflow.model === "none"
              ? "No AI: 0 tokens, $0 a month"
              : `${workflow.model === "large" ? "Large" : "Small"} model · ${formatTokens(workflow.inputTokens + workflow.outputTokens)} tokens · ${formatMoney(workflow.cost)} a month`}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="tokens a month" value={now.tokens} was={after ? before.tokens : undefined} good={after} />
        <Stat label="AI cost a month" value={now.cost} was={after ? before.cost : undefined} good={after} />
        <Stat label="per weekly report" value={now.report} was={after ? before.report : undefined} good={after} />
        <Stat label="longest sync wait" value={now.sync} was={after ? before.sync : undefined} good={after} />
      </div>
    </section>
  );
}
