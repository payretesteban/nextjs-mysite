import type { Metadata } from "next";
import { Animated } from "@/lib/animations";
import { getSiteLog } from "@/lib/siteLog";
import { PAPER, TILT, pad } from "../_home/notePaper";

export const metadata: Metadata = {
  title: "Site log",
  description: "Behind-the-scenes notes from building this site, mostly the funny parts.",
};

// Pick up new notes from Sanity within a minute, without a redeploy
export const revalidate = 60;

export default async function SiteLogPage() {
  const entries = await getSiteLog();

  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      <section className="mb-12">
        <h1 className="text-4xl font-bold">
          <Animated>Site log</Animated>
        </h1>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          Behind-the-scenes notes from building this site. Mostly the funny parts, in the order they happened.
        </p>
      </section>

      <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
        {entries.map((entry, i) => {
          const paper = PAPER[i % PAPER.length];
          return (
            <li
              key={entry._id}
              style={{ "--tilt": `${TILT[i % TILT.length]}deg` } as React.CSSProperties}
              className={`relative rounded-sm p-6 shadow-[0_10px_20px_-8px_rgba(15,23,42,0.35)] transition-transform duration-300 ease-out rotate-(--tilt) hover:rotate-0 hover:-translate-y-1 motion-reduce:transition-none ${paper.bg}`}
            >
              <span aria-hidden="true" className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-3deg] bg-white/50 shadow-sm" />
              <p className={`font-mono text-xs font-semibold tracking-widest ${paper.ink}`}>#{pad(i + 1)}</p>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">{entry.title}</h2>
              {entry.text && <p className="mt-2 leading-relaxed text-slate-800">{entry.text}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
