import { sanityFetch } from "@/sanity/fetch";
import { settingsQuery } from "@/sanity/lib/queries";
import type { Metadata } from "next";

/**
 * Builds the site-wide title and description from the Sanity site settings. Falls back to built-in
 * defaults when no settings exist or Sanity can't be reached.
 * @returns Next.js metadata with a title template, so page titles read "Page | Site title".
 */
export async function getSiteMetadata(): Promise<Metadata> {
  let settings: { title?: string; description?: string } | null = null;
  try {
    settings = await sanityFetch<{ title?: string; description?: string } | null>(settingsQuery);
  } catch (error) {
    // Titles still work with the defaults below
    console.error("[seo] Couldn't load site settings from Sanity, using defaults:", error);
  }

  const fallbackTitle = "Esteban Payret | Tech Lead";
  const fallbackDesc = "Software Engineering Manager and Tech Lead.";

  return {
    title: {
      default: settings?.title || fallbackTitle,
      template: `%s | ${settings?.title || "Esteban Payret"}`,
    },
    description: settings?.description || fallbackDesc,
  };
}