import { sanityFetch } from "@/sanity/fetch";
import { consultationQuery } from "@/sanity/lib/queries";

/** One step of "how it works" beside the homepage buttons, e.g. { title: "Pick a time", text: "Any free slot in my calendar" }. */
export interface ConsultationStep {
  title: string;
  text?: string | null;
}

/** Texts and booking link for the free consultation (Sanity "Free consultation" document). */
export interface Consultation {
  /** Homepage block, right after the intro. */
  homeHeading: string;
  homeText: string;
  /** Services page section. */
  title: string;
  text: string;
  /** Label of the booking button (both places). */
  buttonLabel: string;
  /** Label of the homepage's second button, which goes to /services. */
  servicesLinkLabel: string;
  /** Up to 3 "how it works" steps shown beside the homepage buttons on wide screens. */
  homeSteps: ConsultationStep[];
  /**
   * Booking page, e.g. https://cal.com/your-name/30min. Cal.com links open as a popup on the site;
   * other links open in a new tab. When empty, the button opens the contact form instead.
   */
  bookingUrl?: string | null;
}

/** Used until the document exists in Sanity (import studio-mysite/seed/consultation.ndjson). */
export const DEFAULT_CONSULTATION: Consultation = {
  homeHeading: "Have a technical challenge or project in mind?",
  homeText: "Let’s talk about it. I offer a free 30-minute initial consultation.",
  title: "Free 30-Minute Technical Consultation",
  text: "Have a technical challenge, an idea for an AI implementation, or a product that needs improvement? Let’s spend 30 minutes looking at the problem. No sales pitch — just a technical conversation about what you’re trying to accomplish and possible ways to approach it.",
  buttonLabel: "Book a Free Consultation",
  servicesLinkLabel: "Explore My Services",
  homeSteps: [
    { title: "Pick a time", text: "Any free slot in my calendar" },
    { title: "30-minute call", text: "We talk through your challenge" },
    { title: "Your next step", text: "Clear options for where to go from here" },
  ],
  bookingUrl: null,
};

/**
 * Loads the consultation texts from Sanity (updated when content is published; see @/sanity/fetch). Empty fields use the defaults, and
 * on any error everything falls back to them.
 */
export async function getConsultation(): Promise<Consultation> {
  try {
    const data = await sanityFetch<Partial<Consultation> | null>(consultationQuery);
    const { homeSteps, ...texts } = data ?? {};
    const filled = Object.fromEntries(Object.entries(texts).filter(([, v]) => v != null && String(v).trim() !== ""));
    return { ...DEFAULT_CONSULTATION, ...filled, homeSteps: cleanSteps(homeSteps) };
  } catch (error) {
    console.error("[consultation] Couldn't load from Sanity, using defaults:", error);
    return DEFAULT_CONSULTATION;
  }
}

/** Keeps up to 3 steps that have a title (trimmed); none → the built-in steps. */
export function cleanSteps(steps: unknown): ConsultationStep[] {
  if (!Array.isArray(steps)) return DEFAULT_CONSULTATION.homeSteps;
  const clean = steps
    .filter((s): s is ConsultationStep => typeof s?.title === "string" && s.title.trim() !== "")
    .slice(0, 3)
    .map((s) => ({ title: s.title.trim(), text: typeof s.text === "string" && s.text.trim() ? s.text.trim() : null }));
  return clean.length ? clean : DEFAULT_CONSULTATION.homeSteps;
}

/** A Cal.com event to open as a popup: the site it lives on and the "user/event" part of the link. */
export interface CalTarget {
  origin: string;
  calLink: string;
}

/**
 * Works out whether a booking link is a Cal.com event that can open as a popup, e.g.
 * "https://cal.com/esteban/30min" → { origin: "https://cal.com", calLink: "esteban/30min" }.
 * Returns null for other tools (Calendly, Google…) or invalid links; those open in a new tab.
 */
export function calTargetFrom(url: string | null | undefined): CalTarget | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !/^(app\.)?cal\.com$/i.test(u.hostname)) return null;
    const calLink = u.pathname.replace(/^\/+|\/+$/g, "");
    return calLink ? { origin: "https://cal.com", calLink } : null;
  } catch {
    return null;
  }
}
