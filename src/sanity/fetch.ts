import type { QueryParams } from "next-sanity";
import { client } from "./client";

/**
 * Cache tag on every Sanity request. Publishing in Studio calls /api/revalidate (a Sanity webhook),
 * which expires this tag so every page shows the change straight away.
 */
export const SANITY_TAG = "sanity";

/**
 * Safety net if the webhook isn't set up or a call is missed: cached Sanity data is refreshed at least
 * this often (seconds).
 */
export const SANITY_REVALIDATE = 300;

/**
 * Runs a GROQ query through the shared client with the site's caching: tagged for on-demand
 * revalidation and refreshed at least every `revalidate` seconds.
 * @param revalidate - Override the safety-net refresh time (e.g. hourly for the sitemap).
 */
export function sanityFetch<T>(query: string, params: QueryParams = {}, revalidate: number = SANITY_REVALIDATE): Promise<T> {
  return client.fetch<T>(query, params, { next: { revalidate, tags: [SANITY_TAG] } });
}
