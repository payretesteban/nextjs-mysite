"use client";

import { useAnimation } from "@/app/context/AnimationContext";

export default function AnimatedHeadline({
  headline,
}: {
  headline: string;
}) {
  const { animationClass } = useAnimation();

  return (
    <p
      key={animationClass}
      className={`text-xl text-slate-600 mb-4 ${animationClass}`}
    >
      {headline}
    </p>
  );
}