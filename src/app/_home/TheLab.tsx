import Link from "next/link";
import type { LabItem, LabTestStats } from "@/lib/lab";
import LabPreview from "./LabPreviews";
import LabStrip from "./LabStrip";

/**
 * The homepage "The Lab" section: the site's own experiments (game, Read & Listen, performance, tests) as
 * a swipeable row of cards. Each card links to the page and says what it is, the question behind it and
 * the main tools used.
 *
 * @param items - Experiments to show, in order.
 * @param tests - Latest test numbers for the Tests card, or null to leave them out.
 */
export default function TheLab({ items, tests }: { items: LabItem[]; tests: LabTestStats | null }) {
  return (
    <section aria-labelledby="lab-heading" className="mb-14">
      <h2 id="lab-heading" className="text-2xl font-bold tracking-tight">
        The Lab
      </h2>
      <p className="mt-1 mb-4 text-sm text-slate-600 dark:text-slate-400">Experiments I built into this site. Try them.</p>
      <LabStrip label="Experiments">
        {items.map((item) => (
          <Link
            key={item._id}
            href={item.href}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 motion-reduce:hover:translate-y-0 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <LabPreview kind={item.preview} tests={tests} />
            <div className="flex flex-1 flex-col px-3.5 pt-3 pb-3.5">
              <h3 className="flex items-center gap-1.5 font-bold text-slate-900 group-hover:text-sky-700 dark:text-slate-100 dark:group-hover:text-sky-400">
                {item.title}
                {item.status === "beta" && (
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-violet-800 uppercase dark:bg-violet-950 dark:text-violet-300">
                    Beta
                  </span>
                )}
              </h3>
              <p className="mt-1 text-[13px] leading-snug text-slate-600 dark:text-slate-400">{item.blurb}</p>
              {item.question && <p className="mt-1.5 text-xs leading-snug text-slate-600 italic dark:text-slate-400">{item.question}</p>}
              {item.tech.length > 0 && (
                <ul className="mt-auto flex flex-wrap gap-1 pt-2.5" aria-label="Built with">
                  {item.tech.map((t) => (
                    <li
                      key={t}
                      className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Link>
        ))}
      </LabStrip>
    </section>
  );
}
