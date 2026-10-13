"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { BASE_THEME, THEMES, availableThemes, type Mode, type Theme } from "@/lib/themes";
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
 * System / Light / Dark switch, which applies to the Minimalist theme. Closes on Esc, a click outside or
 * after picking; focus goes back to the button.
 */
export default function ThemePicker() {
  const { theme, mode } = useTheme();
  const today = useToday();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  // Seasonal themes only in season, plus the current one (e.g. previewed with a ?theme= link)
  const themes = THEMES.filter((t) => t.id === theme || (today ? availableThemes(today).includes(t) : !t.season));

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
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Theme and colours"
        title="Theme and colours"
        className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-expanded:border-sky-600 aria-expanded:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white dark:aria-expanded:text-white"
      >
        <PaletteIcon />
      </button>

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
              Light and dark apply to the Minimalist theme.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
