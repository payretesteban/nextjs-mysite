import type { Metadata } from "next";
import TestRunner from "./TestRunner";

export const metadata: Metadata = {
  title: "Tests",
  description: "Run this site's automated test suite and see the results.",
};

export default function TestsPage() {
  // Live runs only work where the source and dev dependencies exist (npm run dev).
  // The deployed site shows the snapshot captured during `npm run build`.
  const mode = process.env.NODE_ENV === "development" ? "live" : "snapshot";

  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      <section className="mb-10">
        <h1 className="text-4xl font-bold">Test Suite</h1>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          This site is covered by unit and component tests written with Vitest and
          Testing Library. Run them and see every result below.
        </p>
      </section>

      <TestRunner mode={mode} />
    </div>
  );
}
