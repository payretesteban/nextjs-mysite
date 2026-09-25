import { client } from "@/sanity/client";
import { servicesPageQuery } from "@/sanity/lib/queries";

/** One service offered, as stored in Sanity. */
export interface Service {
  _id: string;
  title: string;
  /** Optional shorter label for the homepage's rotating "incl. …" line. */
  shortTitle?: string | null;
  summary?: string | null;
  /** Key of an icon in src/app/services/icons.tsx. */
  icon?: string | null;
}

/** Text content of the /services page. */
export interface ServicesPage {
  title: string;
  intro?: string | null;
  /** Heading and text of the call-to-action box at the end of the page. */
  ctaTitle?: string | null;
  ctaText?: string | null;
}

/** Everything the /services page needs: its text and the list of services. */
export interface ServicesPageData {
  page: ServicesPage;
  services: Service[];
}

/** Used until the content exists in Sanity (import studio-mysite/seed/services.ndjson). */
export const DEFAULT_SERVICES_PAGE: ServicesPage = {
  title: "Services",
  intro: "From idea to launch and beyond: software, web, marketing and AI, with the experience of someone who has led engineering teams.",
  ctaTitle: "Have a project in mind?",
  ctaText: "Tell me what you need. I reply within 2 business days.",
};

/** Fallback services, also used when Sanity has none. */
export const DEFAULT_SERVICES: Service[] = [
  { _id: "service-custom-software", title: "Custom Software Development", icon: "code", summary: "Tailor-made applications built around how your business works, from first prototype to production, with clean architecture and tests that keep them maintainable." },
  { _id: "service-digital-marketing", title: "Digital Marketing", icon: "megaphone", summary: "Get found and turn visitors into customers: SEO, analytics, campaigns and conversion tracking that tie spend to real results." },
  { _id: "service-web-development", title: "Web Development", icon: "globe", summary: "Fast, accessible, search-friendly websites and web apps built with modern tools like Next.js, and easy for you to update." },
  { _id: "service-it-consulting", title: "IT Consulting", icon: "compass", summary: "Technical leadership on demand: architecture reviews, roadmaps, team coaching and vendor decisions from someone who has led engineering teams." },
  { _id: "service-ai-workflows", title: "AI-Assisted Dev Workflows & Business Optimization", shortTitle: "AI workflows", icon: "sparkles", summary: "Put AI to work safely: coding assistants, automated reviews and workflow automation that speed up delivery and cut repetitive work." },
];

/** Keep only fields that actually have a value, so defaults fill the gaps. */
function withoutEmpty<T extends object>(obj: T | null | undefined): Partial<T> {
  return Object.fromEntries(Object.entries(obj ?? {}).filter(([, v]) => v != null && v !== "")) as Partial<T>;
}

/**
 * Loads the services page text and services from Sanity (cached for 60 seconds).
 * Missing fields use the defaults, and on any error the whole page falls back to them.
 */
export async function getServicesPageData(): Promise<ServicesPageData> {
  try {
    const data = await client.fetch<{ page: ServicesPage | null; services: Service[] | null }>(
      servicesPageQuery,
      {},
      { next: { revalidate: 60 } }
    );
    return {
      page: { ...DEFAULT_SERVICES_PAGE, ...withoutEmpty(data?.page) },
      services: data?.services?.length ? data.services : DEFAULT_SERVICES,
    };
  } catch (error) {
    console.error("[services] Couldn't load services from Sanity, using defaults:", error);
    return { page: DEFAULT_SERVICES_PAGE, services: DEFAULT_SERVICES };
  }
}
