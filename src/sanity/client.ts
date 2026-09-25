import { createClient } from "next-sanity";

/** Shared Sanity client. Uses the CDN in production (faster, may be a little stale), the live API locally. */
export const client = createClient({
  projectId: "w8am8n9g",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
});