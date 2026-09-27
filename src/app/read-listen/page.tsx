import type { Metadata } from "next";
import { Animated } from "@/lib/animations";
import { libraryText } from "@/lib/readListen/library";
import ReadListen from "./ReadListen";

export const metadata: Metadata = {
  title: "Read & Listen",
  description: "Short texts in two languages, side by side, from beginner to advanced. Read them and listen to both.",
};

/**
 * Read & Listen page: a language-learning tool with AI-written texts in two languages. Everything it needs
 * lives in this route (and /api/read-listen), so none of it is loaded on the homepage. Starts with a
 * built-in Spanish/English text so there's something to read right away.
 */
export default function ReadListenPage() {
  const initial = libraryText("es", "en", "A2", "market");

  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      <section className="mb-8">
        <h1 className="text-4xl font-bold">
          <Animated>Read &amp; Listen</Animated>
        </h1>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          Short texts in two languages, side by side. Read them, listen to both, then try a harder level.
        </p>
      </section>

      <ReadListen initial={initial} />
    </div>
  );
}
