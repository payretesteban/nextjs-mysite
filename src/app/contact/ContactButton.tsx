"use client";

import { useContact } from "./ContactProvider";

export default function ContactButton({ label = "Let’s Work Together" }: { label?: string }) {
  const contact = useContact();
  return (
    <button
      type="button"
      onClick={() => contact?.open()}
      aria-haspopup="dialog"
      className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:translate-y-0 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
    >
      {label}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}
