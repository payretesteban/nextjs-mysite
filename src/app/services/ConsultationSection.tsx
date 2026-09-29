import type { Consultation } from "@/lib/consultation";
import BookButton from "../consultation/BookButton";

/**
 * The services page's free consultation offer: a sky-tinted section with a calendar badge, set apart
 * from the services list and the dark contact banner that follows it.
 */
export default function ConsultationSection({ consultation }: { consultation: Consultation }) {
  return (
    <section
      aria-labelledby="consultation-heading"
      className="mt-12 rounded-3xl bg-gradient-to-br from-sky-50 to-indigo-50 p-6 ring-1 ring-sky-200 sm:p-8 dark:from-sky-950/40 dark:to-indigo-950/40 dark:ring-sky-900"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* "30 min" calendar badge */}
        <div aria-hidden="true" className="flex h-14 w-14 shrink-0 flex-col overflow-hidden rounded-xl bg-white text-center shadow-sm ring-1 ring-sky-200 dark:bg-slate-900 dark:ring-sky-800">
          <span className="bg-sky-700 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">Free</span>
          <span className="flex flex-1 flex-col justify-center leading-none">
            <span className="text-lg font-bold text-slate-900 dark:text-white">30</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400">min</span>
          </span>
        </div>
        <div>
          <h2 id="consultation-heading" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {consultation.title}
          </h2>
          <p className="mt-2 max-w-xl text-slate-700 dark:text-slate-300">{consultation.text}</p>
          <div className="mt-5">
            <BookButton bookingUrl={consultation.bookingUrl} label={consultation.buttonLabel} />
          </div>
        </div>
      </div>
    </section>
  );
}
