"use client";

import { calTargetFrom } from "@/lib/consultation";
import { useContact } from "../contact/ContactProvider";

/** Cal.com's embed script; only loaded when someone clicks a booking button. */
const CAL_SCRIPT = "https://app.cal.com/embed/embed.js";

type CalFn = ((...args: unknown[]) => void) & { q?: unknown[][]; loaded?: boolean; ns?: Record<string, unknown> };
declare global {
  interface Window {
    Cal?: CalFn;
  }
}

/**
 * Installs Cal.com's official loader (a small queue that loads embed.js on first use) and initialises it
 * once. Calls made before the script arrives are queued and run when it loads.
 * @param onError - Called if the script can't be loaded (blocked or offline).
 */
function loadCal(origin: string, onError: () => void): CalFn {
  if (!window.Cal) {
    const cal: CalFn = function (...args: unknown[]) {
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        const script = document.createElement("script");
        script.src = CAL_SCRIPT;
        script.async = true;
        script.addEventListener("error", onError);
        document.head.appendChild(script);
        cal.loaded = true;
      }
      cal.q!.push(args);
    };
    window.Cal = cal;
    cal("init", { origin });
  }
  return window.Cal;
}

/**
 * "Book a Free Consultation" button. With a Cal.com link it opens the booking calendar as a popup on the
 * page (Cal.com then emails the invite to both people); with another scheduling link it opens that page
 * in a new tab; without a link it opens the contact form set to a consultation. Works as a normal link
 * before JavaScript loads.
 *
 * @param props.bookingUrl - Booking page from Sanity.
 * @param props.label - Button text.
 * @param props.variant - "dark" (default) for light backgrounds, "light" for dark ones.
 * @param props.notes - Optional text to prefill in Cal.com's "Additional notes" (e.g. a project snapshot).
 */
export default function BookButton({
  bookingUrl,
  label,
  variant = "dark",
  notes,
}: {
  bookingUrl?: string | null;
  label: string;
  variant?: "dark" | "light";
  notes?: string;
}) {
  const contact = useContact();
  const cal = calTargetFrom(bookingUrl);

  /** Opens the booking page in a new tab (or this tab if the browser blocks pop-ups). */
  const openPage = () => {
    if (!bookingUrl) return;
    // (not "noopener" in the features: then window.open always returns null and we couldn't tell it was blocked)
    const tab = window.open(bookingUrl, "_blank");
    if (tab) tab.opener = null;
    else window.location.href = bookingUrl;
  };

  function onClick(event: React.MouseEvent) {
    // Let people open it in a new tab themselves (Cmd/Ctrl-click, middle click)
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (!bookingUrl) {
      contact?.open("consulting", "Free 30-minute consultation");
      return;
    }
    if (!cal) {
      openPage();
      return;
    }
    const dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    loadCal(cal.origin, openPage)("modal", { calLink: cal.calLink, config: { layout: "month_view", theme: dark ? "dark" : "light", ...(notes ? { notes } : {}) } });
  }

  const colors =
    variant === "light"
      ? "bg-white text-slate-900 hover:bg-slate-100 focus-visible:outline-sky-400 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
      : "bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 focus-visible:outline-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200";

  return (
    <a
      href={bookingUrl || "#contact"}
      target={bookingUrl ? "_blank" : undefined}
      rel={bookingUrl ? "noopener noreferrer" : undefined}
      onClick={onClick}
      aria-haspopup={cal || !bookingUrl ? "dialog" : undefined}
      className={`group inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-0 motion-reduce:hover:translate-y-0 ${colors}`}
    >
      {/* Calendar icon */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
        <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
        <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
      </svg>
      {label}
    </a>
  );
}
