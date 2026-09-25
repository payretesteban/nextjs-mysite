"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Time each name is shown before the next one slides in. */
const INTERVAL_MS = 2500;

/**
 * "See all services → | incl. Web Development" — the service name rotates.
 * All names share one grid cell, so the space is always as wide as the longest name
 * and nothing around it moves when the name changes.
 */
export default function ServicesTicker({ names }: { names: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || names.length < 2) return;
    // Respect "reduce motion": keep showing the first name
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % names.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, names.length]);

  if (!names.length) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Link
        href="/services"
        className="group inline-flex shrink-0 items-center gap-1.5 font-semibold whitespace-nowrap text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-sky-400"
      >
        See all services
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>

      {/* Screen readers get the full list once instead of a constantly changing word */}
      <span className="sr-only">including {names.join(", ")}</span>

      {/* Moves to its own line on narrow screens; the divider only shows when it sits beside the link */}
      <span aria-hidden="true" className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="mr-0.5 hidden text-slate-300 sm:inline dark:text-slate-700">|</span>
        <span className="text-slate-500 dark:text-slate-400">incl.</span>
        <span className="inline-grid overflow-hidden">
          {names.map((name, i) => (
            <span
              // A new key when a name becomes active restarts its slide-in animation
              key={i === index ? `active-${i}` : `idle-${i}`}
              className={`[grid-area:1/1] font-semibold whitespace-nowrap text-slate-900 dark:text-slate-100 ${
                i === index ? "animate-ticker" : "invisible"
              }`}
            >
              {name}
            </span>
          ))}
        </span>
      </span>
    </div>
  );
}
