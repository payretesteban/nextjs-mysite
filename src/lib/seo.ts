import { client } from "@/sanity/client";
import { settingsQuery } from "@/sanity/lib/queries";
import type { Metadata } from "next";

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