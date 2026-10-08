import Link from "next/link";
import { isExternalHref, type LabItem, type LabTestStats } from "@/lib/lab";
import LabPreview from "./LabPreviews";
import LabStrip from "./LabStrip";

const CARD_CLASS =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 motion-reduce:hover:translate-y-0 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700";

/**
 * A whole-card link: pages on this site use Next.js links; other sites open in a new tab.
 * No prefetching for this site's pages: they bring their own styles (e.g. the game's retro font), and
 * prefetching them while the cards are on screen made browsers warn that a stylesheet was preloaded but unused.
 */
function LabCard({ href, children }: { href: string; children: React.ReactNode }) {
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={CARD_CLASS}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={false} className={CARD_CLASS}>
      {children}
    </Link>
  );
}

/**
 * The homepage "The Lab" section: experiments (on this site, like the game and Read & Listen, or on other
 * sites, like the HubSpot version of this site) as a swipeable row of cards. Each card links to the
 * experiment (other sites open in a new tab) and says what it is, the question behind it and the main tools used.
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
      <p className="mt-1 mb-4 text-sm text-slate-600 dark:text-slate-400">Experiments I built, on this site and beyond. Try them.</p>
      <LabStrip label="Experiments">
        {items.map((item) => (
          <LabCard key={item._id} href={item.href}>
            <LabPreview kind={item.preview} tests={tests} href={item.href} />
            <div className="flex flex-1 flex-col px-3.5 pt-3 pb-3.5">
              <h3 className="flex items-center gap-1.5 font-bold text-slate-900 group-hover:text-sky-700 dark:text-slate-100 dark:group-hover:text-sky-400">
                {item.title}
                {item.status === "beta" && (
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-violet-800 uppercase dark:bg-violet-950 dark:text-violet-300">
                    Beta
                  </span>
                )}
                {isExternalHref(item.href) && (
                  <>
                    <span aria-hidden="true" className="text-slate-500 dark:text-slate-400">
                      ↗
                    </span>
                    <span className="sr-only">(opens another site in a new tab)</span>
                  </>
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
          </LabCard>
        ))}
      </LabStrip>
    </section>
  );
}
