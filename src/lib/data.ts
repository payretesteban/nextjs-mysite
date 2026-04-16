import { client } from "@/sanity/client";
import { indexPageQuery } from "@/sanity/lib/queries";
import { IndexPageData } from "./types";

export async function getIndexPageData(): Promise<IndexPageData> {
  return await client.fetch<IndexPageData>(
    indexPageQuery, 
    {}, 
    { next: { revalidate: 30 } }
  );
}