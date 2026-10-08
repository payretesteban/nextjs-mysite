"use client";

import { useAnimation } from "@/app/context/AnimationContext";

/**
 * During the Wave effect, splits text into one span per letter (with its position as `--i`) so each
 * letter can bob in turn; screen readers get the whole text once (the letters are hidden from them).
 * Anything that isn't plain text is left as it is.
 */
function Letters({ children }: { children: React.ReactNode }) {
  if (typeof children !== "string") return <>{children}</>;
  return (
    <>
      <span className="sr-only">{children}</span>
      {[...children].map((ch, i) => (
        <span key={i} aria-hidden="true" style={{ "--i": i } as React.CSSProperties}>
          {ch}
        </span>
      ))}
    </>
  );
}

/**
 * Grey headline paragraph that joins in with fun mode (letters ripple during Wave).
 * The `key` changes with the effect so its animation restarts each time.
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
  const wave = animationClass === "fun-wave";

  return (
    <p key={animationClass} className={`text-slate-600 dark:text-slate-400 ${className} ${animationClass}`.trim()}>
      {wave ? <Letters>{headline}</Letters> : headline}
    </p>
  );
}

/**
 * Wrap any text (e.g. a page title) so it joins in when fun mode is on (letters ripple during Wave;
 * the other effects restyle the whole page). Rendered as an inline-block so effects stay on the text.
 */
export function Animated({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { animationClass } = useAnimation();
  const wave = animationClass === "fun-wave" && typeof children === "string";

  return (
    <span
      key={animationClass}
      className={`inline-block ${className} ${animationClass}`.replace(/\s+/g, " ").trim()}
    >
      {wave ? <Letters>{children}</Letters> : children}
    </span>
  );
}
