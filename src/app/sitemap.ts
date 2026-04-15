import { MetadataRoute } from 'next'
import { client } from "@/sanity/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://estebanpayret.com'

  const posts = await client.fetch(`*[_type == "post"]{ "slug": slug.current, _updatedAt }`)

  const postUrls = posts.map((post: any) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post._updatedAt),
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    ...postUrls,
  ]
}