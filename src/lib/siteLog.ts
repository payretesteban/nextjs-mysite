import { client } from "@/sanity/client";
import { siteLogQuery } from "@/sanity/lib/queries";

/** One note in the site log (a short, mostly funny story from building the site). */
export interface SiteLogEntry {
  _id: string;
  title: string;
  text?: string | null;
}

/** Shown if Sanity has no site log entries yet (or can't be reached). */
export const DEFAULT_SITE_LOG: SiteLogEntry[] = [
  { _id: "sitelog-genesis", title: "The Genesis", text: "Launched the initial site with a minimalist header and core posts functionality. Achieved perfect 100 scores in Lighthouse for both PageSpeed Performance and Accessibility." },
  { _id: "sitelog-animation-tax", title: "The Animation Tax", text: "Perfect desktop score regressed. Experienced a 2% performance hit after implementing the header button animation." },
  { _id: "sitelog-miracle", title: "The Miracle", text: "Score back to 100 after some changes: the mystery of Lighthouse O_o. I didn't actually fix anything. I just stared at the code until it felt intimidated." },
  { _id: "sitelog-typography", title: "Typography", text: "Integrated Tailwind CSS Typography (prose) to ensure consistent styling for lists and complex formatting within post details." },
  { _id: "sitelog-trust-issues", title: "Trust Issues", text: "Wrote some basic tests to ensure core components don't spontaneously combust on deployment. Everything is green, meaning I've successfully verified that my code works exactly under the hyper-specific conditions I tested." },
  { _id: "sitelog-radical-transparency", title: "Radical Transparency", text: "Created a dedicated public test page where visitors can watch test suites execute live in real time." },
  { _id: "sitelog-facelift", title: "The Facelift", text: "Redesigned the top navigation menu to make it cleaner, more modern, and responsive across viewports." },
  { _id: "sitelog-thirst-traps", title: "Thirst Traps Defeated", text: "Finally resolved the classic Next.js hydration error that was haunting the console. Added an automated test just in case it gets any bright ideas about making an uninvited comeback." },
  { _id: "sitelog-speed-checks", title: "Speed Checks & Sanity Checks", text: "Built a live Performance dashboard pulling metrics directly from Google's API. Implemented a 10-minute caching layer because while I love real-time data, I love not burning through API rate limits even more." },
];

/**
 * Loads the site log entries from Sanity, in their set order (cached for 60 seconds).
 * Falls back to `DEFAULT_SITE_LOG` when there are no entries or Sanity can't be reached.
 */
export async function getSiteLog(): Promise<SiteLogEntry[]> {
  try {
    const entries = await client.fetch<SiteLogEntry[] | null>(siteLogQuery, {}, { next: { revalidate: 60 } });
    return entries?.length ? entries : DEFAULT_SITE_LOG;
  } catch (error) {
    console.error("[site log] Couldn't load entries from Sanity, using defaults:", error);
    return DEFAULT_SITE_LOG;
  }
}
