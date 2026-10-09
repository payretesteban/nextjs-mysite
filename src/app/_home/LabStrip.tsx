"use client";

import { Children, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

/** A leftover shorter than this share of a step (e.g. just the edge padding) doesn't count as its own page. */
const SLACK = 0.4;
/** How long each page shows before the strip moves on by itself (keep in step with --animate-lab-progress in globals.css). */
export const AUTOPLAY_MS = 5000;
/** After a swipe on a touch screen, wait this long before moving on by itself again. */
const TOUCH_HOLD_MS = 8000;

/** Subscribes to the "reduce motion" setting. */
function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  query?.addEventListener?.("change", onChange);
  return () => query?.removeEventListener?.("change", onChange);
}
const getReducedMotion = () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/** Distance of one arrow step: a card's width plus the gap between cards. */
function stepOf(list: HTMLElement) {
  const first = list.firstElementChild as HTMLElement | null;
  return first ? first.offsetWidth + 12 : list.clientWidth; // gap-3 = 12px
}

/** Smooth scrolling, unless the visitor prefers reduced motion. */
const behavior = (): ScrollBehavior => (getReducedMotion() ? "auto" : "smooth");

/**
 * A horizontal row of cards that swipes on phones and scrolls with the arrow buttons elsewhere. Uses the
 * browser's own scroll snapping (no carousel library). The next card peeks in at the edge so it's clear
 * there's more; the arrows turn off at either end.
 *
 * It also moves on to the next page every few seconds (back to the start after the last one), but only
 * while nobody is using it: it waits while the mouse is over it, while keyboard focus is inside it, for a
 * moment after a swipe, while it's mostly off screen or the tab is hidden. It never moves for visitors who
 * prefer reduced motion, and a pause button stops it for good (needed for anything that moves on its own).
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

  // What can hold the slideshow back
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, () => true);
  const [paused, setPaused] = useState(false); // the visitor pressed pause
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);


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
  const goTo = useCallback(
    (page: number) => {
      const list = listRef.current;
      if (!list) return;
      const maxScroll = list.scrollWidth - list.clientWidth;
      list.scrollTo({ left: page >= pages - 1 ? maxScroll : page * stepOf(list), behavior: behavior() });
    },
    [pages]
  );

  const autoplay = !reducedMotion && !paused && pages > 1;
  const running = autoplay && !hovering && !focused && !touched && onScreen && tabVisible;

  // Move on to the next page (or back to the first) after a while; restarts whenever the page changes
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => goTo(current + 1 >= pages ? 0 : current + 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [running, current, pages, goTo]);

  // Only play while the strip is mostly on screen and the tab is in front
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    const observer =
      typeof IntersectionObserver !== "undefined" && wrapper
        ? new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.5 })
        : null;
    if (observer && wrapper) observer.observe(wrapper);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      clearTimeout(touchTimer.current);
    };
  }, []);

  /** A finger on the strip: wait a while before moving on by itself again. */
  function holdForTouch(e: React.PointerEvent) {
    if (e.pointerType !== "touch") return;
    setTouched(true);
    clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => setTouched(false), TOUCH_HOLD_MS);
  }

  const arrowClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onPointerDown={holdForTouch}
    >
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
                <span className="relative h-1 w-6 overflow-hidden rounded-full bg-slate-300 transition-colors group-hover/page:bg-slate-400 dark:bg-slate-700">
                  {i === current && (
                    // The current page's bar fills up while the slideshow counts down to the next page
                    <span
                      key={running ? `run-${current}` : "still"}
                      data-testid="page-progress"
                      className={`absolute inset-0 origin-left rounded-full bg-slate-900 dark:bg-white ${running ? "animate-lab-progress" : ""}`}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        {pages > 1 && (
          <div className="flex gap-2">
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setPaused(!paused)}
                aria-label={paused ? "Play the slideshow" : "Pause the slideshow"}
                title={paused ? "Play the slideshow" : "Pause the slideshow"}
                className={arrowClass}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  {paused ? <path d="M8 5.5v13l11-6.5z" /> : <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />}
                </svg>
              </button>
            )}
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
