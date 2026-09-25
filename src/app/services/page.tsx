import type { Metadata } from "next";
import { Animated } from "@/lib/animations";
import { getServicesPageData } from "@/lib/services";
import ServiceList from "./ServiceList";
import ServicesCta from "./ServicesCta";

// Content edits in Sanity show up within a minute
export const revalidate = 60;

/** Page title and description from the services page content in Sanity. */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getServicesPageData();
  return { title: page.title, description: page.intro ?? undefined };
}

/** /services page: title, intro, the list of services and a call to action. */
export default async function ServicesPage() {
  const { page, services } = await getServicesPageData();

  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      <section className="mb-10">
        <h1 className="text-4xl font-bold">
          <Animated>{page.title}</Animated>
        </h1>
        {page.intro && <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">{page.intro}</p>}
      </section>

      <ServiceList services={services} />
      <ServicesCta title={page.ctaTitle} text={page.ctaText} />
    </div>
  );
}
