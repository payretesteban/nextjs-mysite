import { PortableTextBlock } from "next-sanity";

export interface SanityLink {
  _id: string;
  title: string;
  url: string;
  category?: string;
  icon?: string;
}

export interface SanityPost {
  _id: string;
  title: string;
  publishedAt: string;
  slug: {
    current: string;
  };
}

export interface SanityProfile {
  name: string;
  headline: string;
  bio: PortableTextBlock[]; // More specific than 'any' for Sanity text
  profileImage?: {
    asset: any;
    alt?: string;
  };
}

export interface IndexPageData {
  posts: SanityPost[];
  links: SanityLink[];
  profile: SanityProfile;
}