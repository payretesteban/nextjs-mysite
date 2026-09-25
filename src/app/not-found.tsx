import type { Metadata } from "next";
import Link from "next/link";
import { Animated } from "@/lib/animations";
import Arrow from "./_home/Arrow";

export const metadata: Metadata = {
  title: "Page not found",
};

/** Shown for unknown addresses and for posts that don't exist (Next.js sends a 404 status). */
export default function NotFound() {
  return (
    <div className="container mx-auto min-h-[60vh] max-w-3xl p-8">
      <p className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400">404</p>
      <h1 className="mt-2 text-4xl font-bold">
        <Animated>Page not found</Animated>
      </h1>
      <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
        This page doesn&apos;t exist, or it moved. Maybe one of these helps:
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Go to the homepage
        </Link>
        <Link
          href="/posts"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-sky-400"
        >
          See all posts
          <Arrow />
        </Link>
      </div>
    </div>
  );
}
