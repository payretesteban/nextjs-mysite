import type { Metadata } from "next";
import PerformanceRunner from "./PerformanceRunner";
import { Animated } from "@/lib/animations";
import { SITE_URL } from "@/lib/pagespeed";

export const metadata: Metadata = {
  title: "Performance",
  description: "Run a live Lighthouse performance test of this website.",
};

/** The /performance page: a short intro and the runner that tests the live homepage. */
export default function PerformancePage() {
  const host = new URL(SITE_URL).host;

  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      <section className="mb-10">
        <h1 className="text-4xl font-bold">
          <Animated>Performance</Animated>
        </h1>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          Run a live Lighthouse audit of my website 
          and see how fast, accessible and search-friendly it is. The test runs on Google&apos;s
          servers through PageSpeed Insights.
        </p>
      </section>

      <PerformanceRunner url={SITE_URL} />
    </div>
  );
}
