"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { SiteLogEntry } from "@/lib/siteLog";
import Arrow from "./Arrow";
import { PAPER, TILT, pad } from "./notePaper";

/** How many notes are visible in the pile. */
const DEPTH = 3;
const TOSS_MS = 320;
const SWIPE_PX = 40;

/**
 * A pile of sticky notes. Click, tap, swipe or press "Next note" to toss the top note
 * to the back of the pile. Every note sits in the same grid cell, so the pile is always
 * as tall as the longest note and nothing below it jumps around.
 */
export default function SiteLogNotes({ entries, moreHref }: { entries: SiteLogEntry[]; moreHref?: string }) {
  const [top, setTop] = useState(0);
  const [tossing, setTossing] = useState<0 | 1 | -1>(0);
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);
  const n = entries.length;

  if (!n) return null;

  const next = (direction: 1 | -1 = 1) => {
    if (tossing || n < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setTop((t) => (t + 1) % n);
      return;
    }
    setTossing(direction);
    setTimeout(() => {
      setTop((t) => (t + 1) % n);
      setTossing(0);
    }, TOSS_MS);
  };

  return (
    <div>
      <div
        className="relative mx-auto grid max-w-md cursor-pointer touch-pan-y select-none sm:mx-0"
        onPointerDown={(e) => {
          startX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > SWIPE_PX) {
            swiped.current = true;
            next(dx > 0 ? 1 : -1);
          }
        }}
        onClick={() => {
          if (swiped.current) {
            swiped.current = false;
            return;
          }
          next(1);
        }}
      >
        {entries.map((entry, i) => {
          const depth = (i - top + n) % n; // 0 = top of the pile
          const isTop = depth === 0;
          const visible = depth < DEPTH;
          const paper = PAPER[i % PAPER.length];
          const transform =
            isTop && tossing
              ? `translate(${tossing * 70}%, -8%) rotate(${tossing * 14}deg)`
              : `translate(${depth * 6}px, ${depth * 8}px) rotate(${TILT[i % TILT.length]}deg)`;

          return (
            <article
              key={entry._id}
              aria-hidden={!isTop}
              className={`relative flex flex-col rounded-sm p-6 pb-5 shadow-[0_10px_20px_-8px_rgba(15,23,42,0.35)] transition-[transform,opacity] duration-300 ease-out [grid-area:1/1] motion-reduce:transition-none ${paper.bg} ${
                visible ? "" : "invisible"
              }`}
              style={{
                transform,
                zIndex: DEPTH - depth,
                opacity: (isTop && tossing) || !visible ? 0 : 1,
              }}
            >
              {/* A strip of "tape" at the top */}
              <span aria-hidden="true" className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-3deg] bg-white/50 shadow-sm" />
              <p className={`font-mono text-xs font-semibold tracking-widest ${paper.ink}`}>#{pad(i + 1)}</p>
              <h3 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">{entry.title}</h3>
              {entry.text && <p className="mt-2 leading-relaxed text-slate-800">{entry.text}</p>}
              {n > 1 && (
                <button
                  type="button"
                  tabIndex={isTop ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation();
                    next(1);
                  }}
                  className={`mt-auto self-end pt-4 text-xs font-semibold ${paper.ink} cursor-pointer rounded underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900`}
                >
                  Next note →
                </button>
              )}
            </article>
          );
        })}
      </div>

      {/* Tell screen readers which note is on top now */}
      <p className="sr-only" aria-live="polite">
        Note {top + 1} of {n}: {entries[top].title}
      </p>

      {/* The notes behind the top one are shifted down and tilted (transforms don't take up space), so leave room below the pile */}
      <div className="mx-auto mt-12 flex max-w-md items-center justify-between text-sm sm:mx-0">
        <span className="font-mono text-slate-400 tabular-nums" aria-hidden="true">
          {pad(top + 1)} / {pad(n)}
        </span>
        {moreHref && (
          <Link
            href={moreHref}
            className="group inline-flex items-center gap-1.5 font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-sky-400"
          >
            Read the full log
            <Arrow />
          </Link>
        )}
      </div>
    </div>
  );
}
