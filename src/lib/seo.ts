import { client } from "@/sanity/client";
import { settingsQuery } from "@/sanity/lib/queries";
import type { Metadata } from "next";

/**
 * Builds the site-wide title and description from the Sanity site settings (cached for 60 seconds).
 * Falls back to built-in defaults when no settings exist.
 * @returns Next.js metadata with a title template, so page titles read "Page | Site title".
 */
export async function getSiteMetadata(): Promise<Metadata> {
  const settings = await client.fetch(settingsQuery, {}, { next: { revalidate: 60 } });

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