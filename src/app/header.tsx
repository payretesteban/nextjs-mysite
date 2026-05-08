"use client";

import { usePathname } from "next/navigation";
import { SanityLink } from "@/lib/types";
import { useAnimation } from "./context/AnimationContext";

type Animation = {
  class: string;
};

export default function Header({
  links,
  animations,
}: {
  links: SanityLink[];
  animations: Animation[];
}) {
  const pathname = usePathname();

  const { getNextAnimation, animationClass } =
    useAnimation();

  const visibleLinks =
    pathname === "/"
      ? links
      : links.filter((link) => link.category !== "internal");

  const animationsRunning = animationClass !== "";

  return (
    <header className="container mx-auto max-w-3xl p-8 pb-0">
      <nav className="flex gap-4 border-b border-slate-200 pb-8">
        {visibleLinks.map((link) => {
          const isFunky =
            link.class?.includes("funky");

          return (
            <a
              key={link._id}
              href={link.url}
              target={
                link.external ? "_blank" : "_self"
              }
              rel={
                link.external
                  ? "noopener noreferrer"
                  : undefined
              }
              onClick={(e) => {
                if (isFunky) {
                  e.preventDefault();

                  getNextAnimation(animations);
                }
              }}
              className={`px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-sm font-medium transition-colors ${link.class}`}
            >
              {isFunky && animationsRunning
                ? "More Fun"
                : link.title}
            </a>
          );
        })}
      </nav>
    </header>
  );
}