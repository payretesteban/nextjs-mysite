import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";

/** Generates /robots.txt: allow everything except the Studio and API routes, and link the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio/", "/api/"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
