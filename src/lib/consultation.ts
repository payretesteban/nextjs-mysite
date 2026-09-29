import { client } from "@/sanity/client";
import { consultationQuery } from "@/sanity/lib/queries";

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
  bookingUrl: null,
};

/**
 * Loads the consultation texts from Sanity (cached for 60 seconds). Empty fields use the defaults, and
 * on any error everything falls back to them.
 */
export async function getConsultation(): Promise<Consultation> {
  try {
    const data = await client.fetch<Partial<Consultation> | null>(consultationQuery, {}, { next: { revalidate: 60 } });
    const filled = Object.fromEntries(Object.entries(data ?? {}).filter(([, v]) => v != null && String(v).trim() !== ""));
    return { ...DEFAULT_CONSULTATION, ...filled };
  } catch (error) {
    console.error("[consultation] Couldn't load from Sanity, using defaults:", error);
    return DEFAULT_CONSULTATION;
  }
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
