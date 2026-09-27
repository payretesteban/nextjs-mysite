"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** A leftover shorter than this share of a step (e.g. just the edge padding) doesn't count as its own page. */
const SLACK = 0.4;

/**
 * A horizontal row of cards that swipes on phones and scrolls with the arrow buttons elsewhere. Uses the
 * browser's own scroll snapping (no carousel library) and never moves on its own. The next card peeks in
 * at the edge so it's clear there's more; the arrows turn off at either end.
 *
 * @param label - Accessible name for the list, e.g. "Experiments".
 * @param children - One element per card.
 */
export default function LabStrip({ label, children }: { label: string; children: ReactNode }) {
  const listRef = useRef<HTMLUListElement>(null);
  const items = Children.toArray(children);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  // Scroll positions ("pages"): one per arrow step until the last card is fully in view. With 4 cards and
  // 3 visible that's 2 pages, not 4, so the indicator matches what the arrows can actually do.
  const [pages, setPages] = useState(1);
  const [current, setCurrent] = useState(0);

  /** Distance of one arrow step: a card's width plus the gap between cards. */
  const stepOf = (list: HTMLElement) => {
    const first = list.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + 12 : list.clientWidth; // gap-3 = 12px
  };

  // Works out how many pages there are, which one is showing and whether either end has been reached
  const update = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const step = stepOf(list);
    const maxScroll = Math.max(0, list.scrollWidth - list.clientWidth);
    const total = maxScroll <= step * SLACK ? 1 : Math.ceil((maxScroll - step * SLACK) / step) + 1;
    const end = list.scrollLeft >= maxScroll - 4;
    setPages(total);
    setAtStart(list.scrollLeft <= 4);
    setAtEnd(end);
    setCurrent(end ? total - 1 : Math.min(total - 1, Math.round(list.scrollLeft / step)));
  }, []);

  // Measure after the first paint, then again whenever the row changes size (window resize, fonts, new cards)
  useEffect(() => {
    const frame = requestAnimationFrame(update);
    const list = listRef.current;
    const observer = typeof ResizeObserver !== "undefined" && list ? new ResizeObserver(update) : null;
    if (observer && list) observer.observe(list);
    else window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update]);

  /** Smooth scrolling, unless the visitor prefers reduced motion. */
  const behavior = (): ScrollBehavior => (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

  /** Scrolls by one card to the left (-1) or right (1), going all the way to the end when only a sliver is left. */
  function move(direction: -1 | 1) {
    const list = listRef.current;
    if (!list) return;
    const step = stepOf(list);
    const maxScroll = list.scrollWidth - list.clientWidth;
    let left = list.scrollLeft + direction * step;
    if (maxScroll - left < step * SLACK) left = maxScroll;
    if (left < step * SLACK) left = 0;
    list.scrollTo({ left, behavior: behavior() });
  }

  /** Jumps to a page (0-based); the last page shows the end of the row. */
  function goTo(page: number) {
    const list = listRef.current;
    if (!list) return;
    const maxScroll = list.scrollWidth - list.clientWidth;
    list.scrollTo({ left: page >= pages - 1 ? maxScroll : page * stepOf(list), behavior: behavior() });
  }

  const arrowClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";

  return (
    <div>
      <ul
        ref={listRef}
        onScroll={update}
        aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <li key={i} className="w-[232px] flex-none snap-start">
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-1 flex items-center justify-between gap-4">
        {/* One bar per page (scroll position), not per card; hidden when everything fits */}
        {pages > 1 ? (
          <div className="flex gap-1.5">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Page ${i + 1} of ${pages}`}
                aria-current={i === current ? "true" : undefined}
                className="group/page flex h-6 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <span
                  className={`h-1 w-6 rounded-full transition-colors ${
                    i === current ? "bg-slate-900 dark:bg-white" : "bg-slate-300 group-hover/page:bg-slate-400 dark:bg-slate-700"
                  }`}
                />
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        {pages > 1 && (
          <div className="flex gap-2">
            <button type="button" onClick={() => move(-1)} disabled={atStart} aria-label="Previous experiments" className={arrowClass}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
            </button>
            <button type="button" onClick={() => move(1)} disabled={atEnd} aria-label="More experiments" className={arrowClass}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
