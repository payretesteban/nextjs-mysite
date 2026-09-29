import type { Metadata } from "next";
import { Animated } from "@/lib/animations";
import { getServicesPageData } from "@/lib/services";
import ServiceList from "./ServiceList";
import ServicesCta from "./ServicesCta";
import WhyMe from "./WhyMe";
import ConsultationSection from "./ConsultationSection";
import { getConsultation } from "@/lib/consultation";

// Content edits in Sanity show up within a minute
export const revalidate = 60;

/** Page title and description from the services page content in Sanity. */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getServicesPageData();
  return { title: page.title, description: page.intro ?? undefined };
}

/**
 * /services page, in this order: what I can help with (title and intro), the services, the free
 * consultation, why work with me, and the closing call to action.
 */
export default async function ServicesPage() {
  const [{ page, services }, consultation] = await Promise.all([getServicesPageData(), getConsultation()]);

  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      <section className="mb-10">
        <h1 className="text-4xl font-bold">
          <Animated>{page.title}</Animated>
        </h1>
        {page.intro && <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">{page.intro}</p>}
      </section>

      <ServiceList services={services} />
      <ConsultationSection consultation={consultation} />
      <WhyMe title={page.whyTitle} points={page.whyPoints ?? []} />
      <ServicesCta title={page.ctaTitle} text={page.ctaText} />
    </div>
  );
}
