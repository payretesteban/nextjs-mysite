import Link from "next/link";
import type { Consultation } from "@/lib/consultation";
import BookButton from "../consultation/BookButton";

/**
 * Short consultation invitation right after the homepage intro, with two paths: book a free call now,
 * or look at the services first.
 */
export default function HomeConsultation({ consultation }: { consultation: Consultation }) {
  return (
    <div className="mt-6 max-w-2xl rounded-2xl border border-sky-200 bg-sky-50/70 p-5 dark:border-sky-900 dark:bg-sky-950/30">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{consultation.homeHeading}</h2>
      <p className="mt-1 text-slate-700 dark:text-slate-300">{consultation.homeText}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <BookButton bookingUrl={consultation.bookingUrl} label={consultation.buttonLabel} />
        <Link
          href="/services"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-sky-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-sky-300"
        >
          {consultation.servicesLinkLabel}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
