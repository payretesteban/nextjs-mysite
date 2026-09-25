import { PortableTextBlock } from "next-sanity";

/** A link document from Sanity (e.g. a social or contact link). */
export interface SanityLink {
  _id: string;
  title: string;
  url: string;
  /** Optional group the link belongs to. */
  category?: string;
  /** Name of the icon to show next to the title. */
  icon?: string;
  /** Extra CSS classes for this link. */
  class?: string;
  /** True when the link should open in a new tab. */
  external?: boolean;
}

/** A post as listed on the homepage and /posts (no body; the post page fetches that). */
export interface SanityPost {
  _id: string;
  title: string;
  /** ISO date string. */
  publishedAt: string;
  slug: {
    current: string;
  };
  /** Featured posts are listed first and highlighted. */
  featured: boolean;
}

/** The site owner's profile shown at the top of the homepage. */
export interface SanityProfile {
  name: string;
  /** Short tagline under the name (animated on the homepage). */
  headline: string;
  bio: PortableTextBlock[]; // More specific than 'any' for Sanity text
  profileImage?: {
    /** Sanity image asset reference; pass the whole image to `urlFor`. */
    asset: any;
    alt?: string;
  };
}

/** Everything the homepage needs, loaded in one Sanity query (`indexPageQuery`). */
export interface IndexPageData {
  /** Featured first, then newest first. */
  posts: SanityPost[];
  /** Total number of posts (the list above is capped). */
  postCount?: number;
  links: SanityLink[];
  profile: SanityProfile;
}