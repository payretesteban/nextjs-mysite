import { client } from "@/sanity/client";
import { allPostsQuery, indexPageQuery } from "@/sanity/lib/queries";
import { IndexPageData, SanityPost } from "./types";

export async function getIndexPageData(): Promise<IndexPageData> {
  return await client.fetch<IndexPageData>(
    indexPageQuery, 
    {}, 
    { next: { revalidate: 30 } }
  );
}

/** Every post, featured first and then newest first (for the /posts page). */
export async function getAllPosts(): Promise<SanityPost[]> {
  return (await client.fetch<SanityPost[] | null>(allPostsQuery, {}, { next: { revalidate: 30 } })) ?? [];
}
