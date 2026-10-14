"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Time each service name is shown before the next one slides in. */
const INTERVAL_MS = 2600;

/**
 * The homepage's second path next to "Book a Free Consultation": an outlined "Explore My Services" button,
 * plus "5 services · incl. Web Development" where the service name rotates (paused on hover/focus, still for
 * visitors who prefer reduced motion; hidden on phones, where long names don't fit). All names share one grid cell, so nothing around it moves.
 *
 * @param label - Button text (from Sanity).
 * @param names - Service names to rotate through (short names when set).
 */
export default function ExploreServices({ label, names }: { label: string; names: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || names.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % names.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, names.length]);

  return (
    // "contents": the button and the rotating line are separate items of the parent's row, so the button can sit
    // beside "Book a Free Consultation" and only the line wraps below
    <div
      className="contents"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Link
        href="/services"
        data-services-link
        className="group inline-flex items-center gap-2 rounded-full border border-sky-700/30 bg-white/60 px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:border-sky-700 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-sky-300/30 dark:bg-transparent dark:text-sky-300 dark:hover:border-sky-300 dark:hover:bg-sky-300/10"
      >
        {/* Briefcase */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
        </svg>
        {label}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>

      {names.length > 0 && (
        <>
          {/* Screen readers get the full list once instead of a constantly changing word */}
          <span className="sr-only">
            {names.length} services, including {names.join(", ")}
          </span>
          <span aria-hidden="true" data-services-ticker className="hidden items-center sm:flex gap-1.5 text-sm whitespace-nowrap text-slate-600 dark:text-slate-400">
            {names.length} services · incl.
            <span className="inline-grid overflow-hidden">
              {names.map((name, i) => (
                <span
                  // A new key when a name becomes active restarts its slide-in animation
                  key={i === index ? `active-${i}` : `idle-${i}`}
                  className={`[grid-area:1/1] font-semibold whitespace-nowrap text-slate-900 dark:text-slate-100 ${i === index ? "animate-ticker" : "invisible"}`}
                >
                  {name}
                </span>
              ))}
            </span>
          </span>
        </>
      )}
    </div>
  );
}
