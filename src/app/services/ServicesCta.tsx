"use client";

import { useContact } from "../contact/ContactProvider";

/**
 * Dark call-to-action box at the end of the services page; the button opens the contact form (consulting).
 * @param props.title - Heading; hidden when empty.
 * @param props.text - Line under the heading; hidden when empty.
 */
export default function ServicesCta({ title, text }: { title?: string | null; text?: string | null }) {
  const contact = useContact();
  return (
    <section className="mt-12 flex flex-col items-start gap-5 rounded-2xl bg-slate-900 p-8 text-white sm:flex-row sm:items-center sm:justify-between dark:bg-white dark:text-slate-900">
      <div>
        {title && <h2 className="text-xl font-bold">{title}</h2>}
        {text && <p className="mt-1 text-sm text-slate-300 dark:text-slate-600">{text}</p>}
      </div>
      <button
        type="button"
        onClick={() => contact?.open("consulting")}
        aria-haspopup="dialog"
        className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 dark:bg-slate-900 dark:text-white"
      >
        Let’s Work Together
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </section>
  );
}
