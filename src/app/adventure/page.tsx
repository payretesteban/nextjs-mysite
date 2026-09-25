import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import Adventure from "./Adventure";
import { Animated } from "@/lib/animations";

export const metadata: Metadata = {
  title: "The Deep Drop",
  description: "A tiny text adventure: skydive, scuba, an underwater cave and a sunken treasure.",
};

// Classic terminal font for the CRT screen (exposed as --font-vt323)
const vt323 = VT323({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-vt323" });

/** The /adventure page: intro text, the game in a retro CRT monitor, and a safety note. */
export default function AdventurePage() {
  return (
    <>
      <div className="container mx-auto max-w-3xl px-8 pt-8">
        <h1 className="text-4xl font-bold">
          <Animated>The Deep Drop</Animated>
        </h1>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          A tiny text adventure. Skydive toward the sea, survive a parachute malfunction, gear up in the swell and dive into
          an underwater cave for a lost treasure. Type what you want to do, or tap a suggestion. One wrong move and
          it&apos;s game over, but you can always retry.
        </p>
      </div>

      {/* Dark room behind the monitor */}
      <section
        className={`${vt323.variable} mt-8 px-3 py-10 sm:px-8 sm:py-14`}
        style={{ background: "radial-gradient(ellipse at center, #1f2a1f 0%, #070907 70%)" }}
      >
        <div className="mx-auto max-w-3xl">
          <Adventure />
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-8 pt-6 pb-8">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Based on real skydiving and scuba diving safety practices, simplified for a game. It isn&apos;t training:
          skydiving and diving require proper instruction and certification.
        </p>
      </div>
    </>
  );
}
