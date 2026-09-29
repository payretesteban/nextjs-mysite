import type { WhyPoint } from "@/lib/services";

/**
 * "Why work with me" section on the services page: a heading and a grid of short points (title + line).
 * Renders nothing when there are no points.
 */
export default function WhyMe({ title, points }: { title?: string | null; points: WhyPoint[] }) {
  if (!points.length) return null;
  return (
    <section aria-labelledby="why-heading" className="mt-14">
      <h2 id="why-heading" className="text-2xl font-bold tracking-tight">
        {title || "Why work with me"}
      </h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {points.map((point) => (
          <li key={point._key ?? point.title} className="flex gap-3">
            {/* Check mark */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{point.title}</h3>
              {point.text && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{point.text}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
