"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { BASE_THEME, STORAGE, THEMES, availableThemes, currentSeason, type Mode, type Theme } from "@/lib/themes";
import { setMode, setTheme, useTheme } from "./useTheme";

const MODE_OPTIONS: { id: Mode; label: string; icon: string }[] = [
  { id: "system", label: "System", icon: "◐" },
  { id: "light", label: "Light", icon: "☀" },
  { id: "dark", label: "Dark", icon: "☾" },
];

/** Today's date, read after hydration (the server render shows the year-round themes only). */
function useToday(): Date | null {
  return useSyncExternalStore(
    () => () => {},
    () => todayCache ?? (todayCache = new Date()),
    () => null
  );
}
let todayCache: Date | null = null;

/** Palette icon for the button. */
function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.8-1.7H16a5 5 0 0 0 5-5C21 6.6 17 3 12 3Z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" />
      <circle cx="10" cy="7.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}

/** When the "try the themes" tip appears after the page loads, and how long it stays if ignored. */
const TIP_DELAY_MS = 2500;
const TIP_VISIBLE_MS = 12000;

/** Reads a saved value; null when storage is blocked. */
function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Whether to offer the "try the themes" tip: not once the visitor has tried them (opened the picker,
 * picked a theme or closed the tip), and not while a seasonal invitation is due (that one already
 * invites them to a theme). Blocked storage → no tip, so it can't nag on every page.
 */
function shouldOfferTip(): boolean {
  try {
    const ls = window.localStorage;
    if (ls.getItem(STORAGE.tip) || ls.getItem(STORAGE.theme)) return false;
    const now = new Date();
    const season = currentSeason(now);
    if (season && ls.getItem(`${STORAGE.nudge}:${season.id}-${now.getFullYear()}`) === null) return false;
    return true;
  } catch {
    return false;
  }
}

/** Remembers that the visitor has tried the themes (or doesn't want the tip). */
function rememberTip() {
  try {
    window.localStorage.setItem(STORAGE.tip, "done");
  } catch {
    // Storage blocked: the tip doesn't show anyway
  }
}

/** A theme's mini preview: its background with a heading bar, a text line and an accent. */
function Preview({ theme }: { theme: Theme }) {
  const [bg, text, accent] = theme.swatches;
  return (
    <span aria-hidden="true" className="flex h-11 flex-col justify-center gap-1 rounded-t-[9px] px-2" style={{ background: bg }}>
      <span className="h-1.5 w-3/5 rounded-full" style={{ background: text }} />
      <span className="h-1.5 w-full rounded-full opacity-40" style={{ background: text }} />
      <span className="h-1.5 w-2/5 rounded-full" style={{ background: accent }} />
    </span>
  );
}

/**
 * The 🎨 button in the header and its panel (full width under the header on phones): theme cards
 * (seasonal ones only in season) and the
 * System / Light / Dark switch, which applies to the Clean theme. Closes on Esc, a click outside or
 * after picking; focus goes back to the button.
 */
export default function ThemePicker() {
  const { theme, mode } = useTheme();
  const today = useToday();
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState(false);
  // The theme when the page loaded: once it changes, the visitor has tried the themes
  const [initialTheme] = useState(theme);
  const triedElsewhere = theme !== initialTheme;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  // Seasonal themes only in season, plus the current one (e.g. previewed with a ?theme= link)
  const themes = THEMES.filter((t) => t.id === theme || (today ? availableThemes(today).includes(t) : !t.season));

  // A light "try the themes" tip under the button a moment after the page loads, until they've tried them
  useEffect(() => {
    if (!shouldOfferTip()) return;
    const show = setTimeout(() => setTip(true), TIP_DELAY_MS);
    const hide = setTimeout(() => setTip(false), TIP_DELAY_MS + TIP_VISIBLE_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  // Picking a theme anywhere (e.g. the ⌘K menu or the seasonal invitation) counts as trying them
  useEffect(() => {
    if (triedElsewhere && !readStorage(STORAGE.tip)) rememberTip();
  }, [triedElsewhere]);

  /** Opens or closes the panel; opening it counts as trying the themes. */
  function toggle() {
    if (!open) {
      rememberTip();
      setTip(false);
    }
    setOpen(!open);
  }

  // Close on Esc or a click outside the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    // Start keyboard users on the current theme
    panelRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  /** Arrow keys move between the options of a radio group (and pick them, like native radios). */
  function onRadioKeys(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
    const radios = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)'));
    const index = radios.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    e.preventDefault();
    const next = radios[(index + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + radios.length) % radios.length];
    next.focus();
    next.click();
  }

  const modeApplies = theme === BASE_THEME;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Theme and colours"
        title="Theme and colours"
        className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-expanded:border-sky-600 aria-expanded:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white dark:aria-expanded:text-white"
      >
        <PaletteIcon />
      </button>

      {tip && !open && !triedElsewhere && (
        <div
          role="note"
          data-theme-tip
          className="animate-fade-up absolute top-full right-0 z-50 mt-3 flex w-max max-w-[15rem] items-center gap-2 rounded-xl bg-white py-2 pr-1.5 pl-3 text-sm text-slate-700 shadow-lg ring-1 ring-slate-200 print:hidden dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
        >
          {/* Little arrow pointing up at the 🎨 button */}
          <span
            aria-hidden="true"
            className="absolute -top-1.5 right-3 h-3 w-3 rotate-45 bg-white ring-1 ring-slate-200 [clip-path:polygon(0_0,100%_0,0_100%)] dark:bg-slate-800 dark:ring-slate-700"
          />
          <button type="button" onClick={toggle} className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <span aria-hidden="true">✨ </span>
            Try the site themes: Circuit, Clean, Retro and more
          </button>
          <button
            type="button"
            onClick={() => {
              rememberTip();
              setTip(false);
            }}
            aria-label="Dismiss the theme tip"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Theme and colours"
          className="animate-fade-up fixed top-16 right-4 left-4 z-50 rounded-2xl sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-[19rem] border border-slate-200 bg-white p-3 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <p id={`${panelId}-themes`} className="px-1 pb-2 text-[11px] font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-400">
            Theme
          </p>
          <div role="radiogroup" aria-labelledby={`${panelId}-themes`} onKeyDown={onRadioKeys} className="grid grid-cols-2 gap-2">
            {themes.map((t) => {
              const selected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => {
                    setTheme(t.id);
                  }}
                  title={t.description}
                  className={`overflow-hidden rounded-[10px] border text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    selected ? "border-sky-600 ring-2 ring-sky-200 dark:ring-sky-900" : "border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
                  }`}
                >
                  <Preview theme={t} />
                  <span className="flex items-center justify-between gap-1 px-2 py-1.5 text-xs font-semibold">
                    <span className="truncate">{t.name}</span>
                    {t.season ? (
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 text-[9px] font-bold tracking-wide text-amber-900 uppercase dark:bg-amber-900/50 dark:text-amber-200">
                        Season
                      </span>
                    ) : (
                      selected && <span aria-hidden="true">✓</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <p id={`${panelId}-mode`} className="mt-3 px-1 pb-2 text-[11px] font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-400">
            Mode
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${panelId}-mode`}
            aria-describedby={modeApplies ? undefined : `${panelId}-mode-note`}
            onKeyDown={onRadioKeys}
            className="flex rounded-[10px] bg-slate-100 p-1 text-xs dark:bg-slate-800"
          >
            {MODE_OPTIONS.map((m) => {
              const selected = m.id === mode;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  disabled={!modeApplies}
                  onClick={() => setMode(m.id)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 font-medium transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <span aria-hidden="true">{m.icon}</span>
                  {m.label}
                </button>
              );
            })}
          </div>
          {!modeApplies && (
            <p id={`${panelId}-mode-note`} className="mt-2 px-1 text-xs text-slate-600 dark:text-slate-400">
              Light and dark apply to the Clean theme.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
