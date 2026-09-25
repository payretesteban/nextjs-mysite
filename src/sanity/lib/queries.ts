import { defineQuery } from "next-sanity";

/** Site title and description from the site settings, for the default page metadata (`getSiteMetadata`). */
export const settingsQuery = defineQuery(`
  *[_type == "siteSettings"][0]{
    title,
    description
    } 
`);

/** Homepage data: up to 12 posts (featured first), the total post count, links and the profile. */
export const indexPageQuery = defineQuery(`{
  "posts": *[_type == "post" && defined(slug.current)] | order(coalesce(featured, false) desc, publishedAt desc)[0...12] {
    _id, 
    title, 
    slug, 
    publishedAt,
    featured
  },
  "postCount": count(*[_type == "post" && defined(slug.current)]),
  "links": *[_type == "link"] | order(sort asc) {
    _id, 
    title, 
    url, 
    category, 
    icon,
    class,
    sort 
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

/** The services page text and the list of services (also used by the homepage services ticker). */
export const servicesPageQuery = defineQuery(`{
  "page": *[_type == "servicesPage"][0] {
    title,
    intro,
    ctaTitle,
    ctaText
  },
  "services": *[_type == "service" && defined(title)] | order(coalesce(order, 999) asc, title asc) {
    _id,
    title,
    shortTitle,
    summary,
    icon
  }
}`);

/** Post slugs and last-updated dates for the sitemap (`sitemap.ts`). */
export const sitemapQuery = defineQuery(`{
  "posts": *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    "slug": slug.current,
    _updatedAt
  },
  "homeUpdatedAt": *[_type in ["profile", "post", "link"]] | order(_updatedAt desc)[0]._updatedAt,
  "servicesUpdatedAt": *[_type in ["service", "servicesPage"]] | order(_updatedAt desc)[0]._updatedAt,
  "siteLogUpdatedAt": *[_type == "siteLogEntry"] | order(_updatedAt desc)[0]._updatedAt
}`);

/** Every post, featured first and then newest first, for the /posts page. */
export const allPostsQuery = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(coalesce(featured, false) desc, publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    featured
  }
`);

/** Site log entries in their set order, for the homepage notes and the /site-log page. */
export const siteLogQuery = defineQuery(`
  *[_type == "siteLogEntry" && defined(title)] | order(order asc, _createdAt asc) {
    _id,
    title,
    text
  }
`);
