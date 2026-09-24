import type { MetadataRoute } from "next";
import { client } from "@/sanity/client";
import { sitemapQuery } from "@/sanity/lib/queries";
import { SITE_ORIGIN } from "@/lib/site";

// Rebuild the sitemap at most once an hour, so new posts appear without a redeploy
export const revalidate = 3600;

interface SitemapData {
  posts: { slug: string; _updatedAt: string }[] | null;
  homeUpdatedAt: string | null;
  servicesUpdatedAt: string | null;
}

const toDate = (iso?: string | null) => (iso ? new Date(iso) : undefined);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let data: SitemapData = { posts: [], homeUpdatedAt: null, servicesUpdatedAt: null };
  try {
    data = await client.fetch<SitemapData>(sitemapQuery, {}, { next: { revalidate } });
  } catch (error) {
    // Still publish the fixed pages if Sanity can't be reached
    console.error("[sitemap] Couldn't load content from Sanity:", error);
  }

  const pages: MetadataRoute.Sitemap = [
    { url: SITE_ORIGIN, lastModified: toDate(data.homeUpdatedAt), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_ORIGIN}/services`, lastModified: toDate(data.servicesUpdatedAt), changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/adventure`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_ORIGIN}/performance`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_ORIGIN}/tests`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const posts: MetadataRoute.Sitemap = (data.posts ?? []).map((post) => ({
    url: `${SITE_ORIGIN}/${encodeURIComponent(post.slug)}`,
    lastModified: toDate(post._updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...pages, ...posts];
}
