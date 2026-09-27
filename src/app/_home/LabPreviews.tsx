import type { LabPreview as PreviewKind, LabTestStats } from "@/lib/lab";

/**
 * Small decorative picture at the top of a Lab card, drawn with CSS/SVG so it costs nothing to load.
 * Hidden from screen readers: the card's title and text say what the experiment is.
 */
export default function LabPreview({ kind, tests }: { kind: PreviewKind; tests: LabTestStats | null }) {
  return (
    <div aria-hidden="true" className="relative h-24 overflow-hidden">
      {kind === "game" && <GamePreview />}
      {kind === "readListen" && <ReadListenPreview />}
      {kind === "performance" && <PerformancePreview />}
      {kind === "tests" && <TestsPreview stats={tests} />}
      {kind === "generic" && <GenericPreview />}
    </div>
  );
}

/** A tiny green CRT screen, like the one on /adventure. */
function GamePreview() {
  return (
    <div className="flex h-full items-center justify-center bg-stone-900">
      <div className="h-[70px] w-4/5 rounded-lg border-4 border-stone-300 bg-green-950 px-2 py-1 font-mono text-[11px] leading-snug text-green-400 [text-shadow:0_0_4px_#22c55e]">
        &gt; JUMP
        <br />
        Freefall. 4,000 m…
        <br />[ PULL ] [ WAIT ]
      </div>
    </div>
  );
}

/** Two side-by-side sentences, the first highlighted, like on /read-listen. */
function ReadListenPreview() {
  return (
    <div className="grid h-full grid-cols-2 gap-1.5 bg-slate-50 p-2.5 text-[10px] leading-snug text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
      <div className="rounded-md border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900">
        <span className="bg-amber-100 dark:bg-amber-900/60">Hoy voy al mercado.</span> Compro fruta fresca.
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900">
        <span className="bg-amber-100 dark:bg-amber-900/60">Today I go to the market.</span> I buy fresh fruit.
      </div>
    </div>
  );
}

/** A speed gauge with its needle near the top of the green zone. */
function PerformancePreview() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-800/60">
      <svg viewBox="0 0 120 70" className="h-16 w-28">
        <path d="M12 62a48 48 0 0 1 96 0" fill="none" stroke="#fee2e2" strokeWidth="10" />
        <path d="M44 16a48 48 0 0 1 32 0" fill="none" stroke="#fef3c7" strokeWidth="10" />
        <path d="M76 16a48 48 0 0 1 32 46" fill="none" stroke="#22c55e" strokeWidth="10" />
        <line x1="60" y1="62" x2="95" y2="30" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" className="dark:stroke-white" />
        <circle cx="60" cy="62" r="6" className="fill-slate-900 dark:fill-white" />
      </svg>
    </div>
  );
}

/** A flask on a dotted grid, for experiments without a picture of their own. */
function GenericPreview() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] dark:bg-slate-800/60 dark:bg-[radial-gradient(#334155_1px,transparent_1px)]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-sky-700 dark:text-sky-400">
        <path d="M9 3h6M10 3v6.5L4.8 18.2A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.8L14 9.5V3" />
        <path d="M7.5 15h9" />
      </svg>
    </div>
  );
}

/** A pass bar with the latest real numbers when available. */
function TestsPreview({ stats }: { stats: LabTestStats | null }) {
  const share = stats ? Math.round((stats.passed / stats.total) * 100) : 100;
  return (
    <div className="flex h-full flex-col justify-center gap-2 bg-slate-50 px-4 text-[11px] text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
      <div className="flex justify-between">
        <b>{stats ? `${stats.passed} passed` : "Test suite"}</b>
        {stats?.coverage !== undefined && <span className="font-mono">{stats.coverage}% coverage</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-rose-200">
        <div className="h-full rounded-full bg-green-600" style={{ width: `${share}%` }} />
      </div>
      <div className="flex justify-between">
        <span>Vitest</span>
        {stats && <span>{stats.total} checks</span>}
      </div>
    </div>
  );
}
