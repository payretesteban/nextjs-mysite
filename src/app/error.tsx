"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Shown inside the normal header and footer when a page fails to load (e.g. a content service is down).
 * Offers to try again, which re-renders the page without a full reload.
 */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[page] Couldn't render this page:", error);
  }, [error]);

  return (
    <div className="container mx-auto min-h-[60vh] max-w-3xl xl:max-w-6xl p-8">
      <p className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400">Something went wrong</p>
      <h1 className="mt-2 text-4xl font-bold">This page didn&apos;t load</h1>
      <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
        Part of the site is having a moment. Try again, or head back to the homepage.
        {error.digest && <span className="mt-2 block font-mono text-xs">Reference: {error.digest}</span>}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-sky-400"
        >
          Go to the homepage
        </Link>
      </div>
    </div>
  );
}
