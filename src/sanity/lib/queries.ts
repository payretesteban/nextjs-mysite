import { defineQuery } from "next-sanity";

export const settingsQuery = defineQuery(`
  *[_type == "siteSettings"][0]{
    title,
    description
    } 
`);

export const indexPageQuery = defineQuery(`{
  "posts": *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...12] {
    _id, 
    title, 
    slug, 
    publishedAt 
  },
  "links": *[_type == "link"] | order(category asc) {
    _id, 
    title, 
    url, 
    category, 
    icon 
  },
  "profile": *[_type == "profile"][0] {
    name,
    headline,
    bio,
    profileImage {
      asset,
      alt
    }
  }
}`);