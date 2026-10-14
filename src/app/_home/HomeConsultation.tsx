import type { Consultation } from "@/lib/consultation";
import BookButton from "../consultation/BookButton";
import ExploreServices from "./ExploreServices";

/**
 * Short consultation invitation right after the homepage intro, with two paths: book a free call now,
 * or look at the services first. On wide screens (xl) the right half shows "how it works" as numbered
 * steps on a line, behind a thin divider.
 *
 * @param consultation - Texts, steps and booking link (from Sanity, with defaults).
 * @param serviceNames - Names for the rotating "incl. …" next to the services button.
 */
export default function HomeConsultation({ consultation, serviceNames = [] }: { consultation: Consultation; serviceNames?: string[] }) {
  const steps = consultation.homeSteps;
  return (
    <div
      data-panel="consultation"
      className="mt-6 max-w-2xl rounded-2xl border border-sky-200 bg-sky-50/70 p-5 xl:grid xl:max-w-none xl:grid-cols-2 xl:items-center xl:gap-8 xl:p-6 dark:border-sky-900 dark:bg-sky-950/30"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{consultation.homeHeading}</h2>
        <p className="mt-1 text-slate-700 dark:text-slate-300">{consultation.homeText}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <BookButton bookingUrl={consultation.bookingUrl} label={consultation.buttonLabel} />
          <ExploreServices label={consultation.servicesLinkLabel} names={serviceNames} />
        </div>
      </div>

      {steps.length > 0 && (
        <div data-steps className="hidden border-l border-sky-200 py-2 pl-8 xl:block dark:border-sky-900">
          <h3 className="sr-only">How it works</h3>
          <ol
            className={`relative grid gap-3 ${
              steps.length > 1
                ? "before:absolute before:top-4 before:right-[var(--edge)] before:left-[var(--edge)] before:h-0.5 before:bg-sky-300 before:content-[''] dark:before:bg-sky-800"
                : ""
            }`}
            // One column per step; the line runs from the first node's centre to the last one's
            style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, ["--edge" as string]: `${50 / steps.length}%` }}
          >
            {steps.map((step, i) => (
              <li key={i} className="relative text-center">
                <span
                  aria-hidden="true"
                  data-step-node
                  className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-sky-700 font-mono text-xs font-bold text-white dark:bg-sky-400 dark:text-slate-900"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-2.5 block font-semibold text-slate-900 dark:text-slate-100">{step.title}</span>
                {step.text && <span className="mt-0.5 block text-[13px] leading-snug text-slate-600 dark:text-slate-400">{step.text}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
