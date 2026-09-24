"use client";

import { useContact } from "../contact/ContactProvider";
import { ServiceIcon } from "./icons";
import type { Service } from "@/lib/services";

/** Numbered list of services. Clicking a row opens the contact form about that service. */
export default function ServiceList({ services }: { services: Service[] }) {
  const contact = useContact();

  return (
    <ol className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {services.map((service, i) => {
        const summaryId = `service-${service._id}-summary`;
        return (
          <li
            key={service._id}
            className="animate-fade-up group relative isolate grid grid-cols-[2.75rem_1fr_auto] items-start gap-3 py-7 sm:grid-cols-[4.5rem_1fr_auto] sm:gap-4"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Hover highlight: bleeds slightly past the text but keeps the divider lines straight */}
            <span
              aria-hidden="true"
              className="absolute inset-y-1 -inset-x-4 -z-10 rounded-xl transition-colors group-hover:bg-slate-50 group-focus-within:bg-slate-50 dark:group-hover:bg-slate-900 dark:group-focus-within:bg-slate-900"
            />
            <span
              aria-hidden="true"
              className="font-mono text-3xl leading-none font-bold text-slate-200 transition-colors group-hover:text-sky-500 group-focus-within:text-sky-500 sm:text-4xl dark:text-slate-700"
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0">
              <h2 className="flex items-start gap-2 text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-100">
                <span className="mt-1 shrink-0 text-slate-400 transition-colors group-hover:text-sky-500 group-focus-within:text-sky-500">
                  <ServiceIcon name={service.icon} />
                </span>
                {service.title}
              </h2>
              {service.summary && (
                <p id={summaryId} className="mt-1.5 max-w-lg text-slate-600 dark:text-slate-400">
                  {service.summary}
                </p>
              )}
            </div>

            <span
              aria-hidden="true"
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white group-focus-within:border-slate-900 group-focus-within:bg-slate-900 group-focus-within:text-white dark:border-slate-700 dark:group-hover:border-white dark:group-hover:bg-white dark:group-hover:text-slate-900 dark:group-focus-within:border-white dark:group-focus-within:bg-white dark:group-focus-within:text-slate-900"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>

            {/* The whole row is the button (easier to hit on phones); headings stay proper headings */}
            <button
              type="button"
              onClick={() => contact?.open("consulting", service.title)}
              aria-haspopup="dialog"
              aria-label={`Get in touch about ${service.title}`}
              aria-describedby={service.summary ? summaryId : undefined}
              className="absolute inset-y-1 -inset-x-4 rounded-xl focus-visible:outline-2 focus-visible:outline-blue-600"
            />
          </li>
        );
      })}
    </ol>
  );
}
