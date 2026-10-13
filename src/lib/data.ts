import { sanityFetch } from "@/sanity/fetch";
import { allPostsQuery, indexPageQuery, layoutQuery } from "@/sanity/lib/queries";
import type { IndexPageData, SanityLink, SanityPost, SanityProfile } from "./types";

/** Shown at the top of the homepage if the profile can't be loaded from Sanity. */
export const FALLBACK_PROFILE: SanityProfile = { name: "Esteban Payret", headline: "Tech Lead & People Manager", bio: [] };

/** The header and footer's data. */
export interface LayoutData {
  links: SanityLink[];
  /** The owner's name (for the logo initials), or null when unknown. */
  name: string | null;
}

/**
 * Loads the homepage data (posts, links and profile) from Sanity. Updated when content is published
 * (see @/sanity/fetch). If Sanity can't be reached, the homepage still renders: no posts, the built-in
 * profile and the rest of the page's own fallbacks.
 */
export async function getIndexPageData(): Promise<IndexPageData> {
  try {
    const data = await sanityFetch<Partial<IndexPageData> | null>(indexPageQuery);
    const posts = data?.posts ?? [];
    return { posts, postCount: data?.postCount ?? posts.length, links: data?.links ?? [], profile: data?.profile ?? FALLBACK_PROFILE };
  } catch (error) {
    console.error("[home] Couldn't load the homepage from Sanity, using fallbacks:", error);
    return { posts: [], postCount: 0, links: [], profile: FALLBACK_PROFILE };
  }
}

/**
 * Loads just what the header and footer need on every page (a small query, instead of the whole
 * homepage). Never throws: if Sanity is down, every page still renders with the built-in menu items.
 */
export async function getLayoutData(): Promise<LayoutData> {
  try {
    const data = await sanityFetch<{ links: SanityLink[] | null; profile: { name?: string } | null } | null>(layoutQuery);
    return { links: data?.links ?? [], name: data?.profile?.name ?? null };
  } catch (error) {
    console.error("[layout] Couldn't load links from Sanity, using defaults:", error);
    return { links: [], name: null };
  }
}

/**
 * Every post, featured first and then newest first, for the /posts page. Returns an empty list when
 * there are no posts or Sanity can't be reached.
 */
export async function getAllPosts(): Promise<SanityPost[]> {
  try {
    return (await sanityFetch<SanityPost[] | null>(allPostsQuery)) ?? [];
  } catch (error) {
    console.error("[posts] Couldn't load posts from Sanity:", error);
    return [];
  }
}
