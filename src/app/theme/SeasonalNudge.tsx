"use client";

import { useEffect, useState } from "react";
import { BASE_THEME, DEFAULT_THEME, STORAGE, currentSeason, type Theme } from "@/lib/themes";
import { setTheme, useTheme } from "./useTheme";

/** True on the everyday themes (Circuit or Minimalist), where a seasonal invitation makes sense. */
const onEverydayTheme = (theme: string) => theme === DEFAULT_THEME || theme === BASE_THEME;

/** Storage key for "already invited this season", e.g. "ep-theme-nudge:halloween-2026". */
const nudgeKey = (theme: Theme, date: Date) => `${STORAGE.nudge}:${theme.id}-${date.getFullYear()}`;

/** Whether this season's invitation was already shown (or storage is blocked, so don't nag). */
function alreadyInvited(key: string) {
  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return true;
  }
}

/** Remembers that this season's invitation was answered. */
function remember(key: string, answer: string) {
  try {
    window.localStorage.setItem(key, answer);
  } catch {
    // Nothing to do: it just may show again next visit
  }
}

/**
 * A small, one-time invitation in the corner during a theme's season ("It's spooky season. Try the
 * Halloween theme?"). Appears a few seconds after the page loads, only if the visitor is on an everyday
 * theme (Circuit or Minimalist) and hasn't answered it this year. Either button closes it for the rest of the season.
 */
export default function SeasonalNudge() {
  const { theme: current } = useTheme();
  const [offer, setOffer] = useState<{ theme: Theme; key: string } | null>(null);

  useEffect(() => {
    if (!onEverydayTheme(current)) return;
    const now = new Date();
    const season = currentSeason(now);
    if (!season) return;
    const key = nudgeKey(season, now);
    if (alreadyInvited(key)) return;
    const timer = setTimeout(() => setOffer({ theme: season, key }), 4000);
    return () => clearTimeout(timer);
  }, [current]);

  if (!offer || !onEverydayTheme(current)) return null;

  /** Closes the invitation for the season, optionally switching to the theme. */
  const answer = (accept: boolean) => {
    remember(offer.key, accept ? "accepted" : "dismissed");
    if (accept) setTheme(offer.theme.id);
    setOffer(null);
  };

  return (
    <div
      role="region"
      aria-label="Seasonal theme"
      className="animate-fade-up fixed right-4 bottom-4 left-4 z-[65] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-slate-900 p-3 pl-4 text-sm text-white shadow-2xl sm:left-auto print:hidden dark:bg-white dark:text-slate-900"
    >
      <span aria-hidden="true" className="text-xl">
        {offer.theme.season?.emoji}
      </span>
      <p className="flex-1">{offer.theme.season?.invite}</p>
      <button
        type="button"
        onClick={() => answer(true)}
        className="shrink-0 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
      >
        Try it
      </button>
      <button
        type="button"
        onClick={() => answer(false)}
        aria-label="No thanks"
        title="No thanks"
        className="shrink-0 rounded-full p-1.5 text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-slate-600 dark:hover:text-slate-900"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
