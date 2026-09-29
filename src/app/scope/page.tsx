import type { Metadata } from "next";
import { Animated } from "@/lib/animations";
import { getConsultation } from "@/lib/consultation";
import ScopeWizard from "./ScopeWizard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Project Scoping Assistant",
  description: "Answer seven quick questions and get a rough size, timeline, phases and risks for your software project.",
};

/** The /scope page: title, a short intro and the scoping wizard. */
export default async function ScopePage() {
  const consultation = await getConsultation();
  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      <section className="mb-8 print:mb-4">
        <h1 className="text-4xl font-bold">
          <Animated>Project Scoping Assistant</Animated>
        </h1>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          Thinking about a new product, an AI feature or improving what you have? Get a rough plan in two minutes.
        </p>
      </section>
      <ScopeWizard bookingUrl={consultation.bookingUrl} bookLabel={consultation.buttonLabel} />
    </div>
  );
}
