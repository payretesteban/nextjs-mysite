"use client";

import { useAnimation } from "@/app/context/AnimationContext";

/**
 * Grey headline paragraph that plays the current fun mode animation.
 * The `key` changes with the animation class so the animation restarts each time.
 */
export default function AnimatedHeadline({
  headline,
  className = "mb-4 text-xl",
}: {
  headline: string;
  /** Size and spacing classes; defaults to text-xl with a bottom margin. */
  className?: string;
}) {
  const { animationClass } = useAnimation();

  return (
    <p
      key={animationClass}
      className={`text-slate-600 ${className} ${animationClass}`}
    >
      {headline}
    </p>
  );
}

/**
 * Wrap any text (e.g. a page title) so it joins in when fun mode is on.
 * Rendered as an inline-block so transforms like spin/wiggle pivot around the text itself.
 */
export function Animated({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { animationClass } = useAnimation();

  return (
    <span
      key={animationClass}
      className={`inline-block ${className} ${animationClass}`.replace(/\s+/g, " ").trim()}
    >
      {children}
    </span>
  );
}
