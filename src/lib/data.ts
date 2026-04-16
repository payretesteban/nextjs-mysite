import { client } from "@/sanity/client";
import { indexPageQuery } from "@/sanity/lib/queries";

export async function getIndexPageData() {
  return await client.fetch(indexPageQuery, {}, { next: { revalidate: 30 } });
}